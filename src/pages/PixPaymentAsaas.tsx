import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts } from '@/contexts/ProductContext';
import { useAsaas } from '@/contexts/AsaasContext';
import { logger } from '@/utils/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const PixPaymentAsaas: React.FC = () => {
  const { productSlug } = useParams<{ productSlug: string }>();
  const { getProductBySlug } = useProducts();
  const { settings } = useAsaas();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadProductAndCreateCharge = async () => {
      try {
        if (!productSlug) throw new Error("Slug do produto não informado.");
        const foundProduct = await getProductBySlug(productSlug);
        if (!foundProduct) throw new Error("Produto não encontrado.");
        setProduct(foundProduct);

        if (!settings?.asaasApiKey) throw new Error("Chave da API do Asaas não configurada.");
        logger.log("Produto encontrado:", foundProduct);

        // Criar cliente via Netlify Function
        const customerResponse = await fetch('/.netlify/functions/create-asaas-customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Cliente PIX',
            email: 'cliente@email.com',
            cpfCnpj: '00000000000',
            phone: '0000000000',
            postalCode: '00000000',
            address: 'Rua Exemplo',
            addressNumber: '123',
            complement: '',
            province: 'Centro',
          }),
        });

        const customerData = await customerResponse.json();
        logger.log('Cliente criado:', customerData);

        if (!customerData?.id) throw new Error('Erro ao criar cliente no Asaas.');

        // Criar pagamento
        const paymentResponse = await fetch('https://www.asaas.com/api/v3/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': settings.asaasApiKey,
          },
          body: JSON.stringify({
            customer: customerData.id,
            billingType: 'PIX',
            value: foundProduct.preco,
            dueDate: new Date().toISOString().split('T')[0],
          }),
        });

        const paymentData = await paymentResponse.json();
        logger.log('Cobrança gerada:', paymentData);

        if (!paymentData?.pix) throw new Error('Erro ao gerar QR Code PIX no Asaas.');
        setPaymentData(paymentData);

      } catch (error: any) {
        logger.error("Erro ao gerar pagamento via Asaas:", error);
        toast({
          title: "Erro ao gerar cobrança",
          description: error.message || "Não foi possível iniciar o pagamento.",
          variant: "destructive",
        });
        navigate('/payment-failed');
      } finally {
        setLoading(false);
      }
    };

    loadProductAndCreateCharge();
  }, [productSlug, getProductBySlug, settings, toast, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Gerando cobrança via Asaas...</span>
      </div>
    );
  }

  if (!product || !paymentData?.pix) {
    return <div className="text-center text-red-500 mt-10">Erro ao carregar cobrança PIX.</div>;
  }

  return (
    <div className="max-w-lg mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Pagamento PIX via Asaas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <img
            src={paymentData.pix.qrCodeImage}
            alt="QR Code PIX"
            className="mx-auto w-60 h-60 border rounded"
          />
          <div className="text-center">
            <p className="font-semibold">Escaneie o QR Code ou copie o código abaixo:</p>
            <p className="bg-gray-100 p-2 rounded break-all text-sm">{paymentData.pix.payload}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground text-sm mt-2">
              Produto: <strong>{product.nome}</strong> — R$ {Number(product.preco).toFixed(2)}
            </p>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => navigator.clipboard.writeText(paymentData.pix.payload)}>
              Copiar código PIX
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PixPaymentAsaas;

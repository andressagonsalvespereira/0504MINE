import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useProducts } from '@/contexts/ProductContext';
import { useAsaas } from '@/contexts/AsaasContext';
import { logger } from '@/utils/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const PixPaymentAsaas: React.FC = () => {
  const { productSlug } = useParams<{ productSlug: string }>();
  const { state } = useLocation();
  const { getProductBySlug } = useProducts();
  const { settings } = useAsaas();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadProductAndPaymentData = async () => {
      try {
        if (!productSlug) throw new Error("Slug do produto não informado.");
        const foundProduct = await getProductBySlug(productSlug);
        if (!foundProduct) throw new Error("Produto não encontrado.");
        setProduct(foundProduct);

        if (!settings?.asaasApiKey) throw new Error("Chave da API do Asaas não configurada.");
        logger.log("Produto encontrado:", foundProduct);

        // Usar os dados do pedido passados via state
        const orderData = state?.orderData;
        logger.log("Order data received via state:", orderData);

        if (!orderData || !orderData.pixDetails) {
          throw new Error("Dados do pagamento PIX não encontrados.");
        }

        logger.log("PIX details from orderData:", orderData.pixDetails);

        // Validar o qrCodeImage
        const qrCodeImage = orderData.pixDetails.qrCodeImage;
        if (!qrCodeImage || !qrCodeImage.startsWith("data:image/")) {
          logger.error("qrCodeImage inválido ou ausente:", qrCodeImage);
          setQrCodeError("Imagem do QR Code não disponível ou inválida.");
        }

        // Os dados do QR code já foram obtidos por create-asaas-customer
        setPaymentData({
          pix: {
            payload: orderData.pixDetails.qrCode,
            qrCodeImage: qrCodeImage,
          },
        });

      } catch (error: any) {
        logger.error("Erro ao carregar dados do pagamento via Asaas:", error);
        toast({
          title: "Erro ao carregar cobrança",
          description: error.message || "Não foi possível carregar o pagamento.",
          variant: "destructive",
        });
        navigate('/payment-failed');
      } finally {
        setLoading(false);
      }
    };

    loadProductAndPaymentData();
  }, [productSlug, getProductBySlug, settings, state, toast, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Carregando dados do pagamento...</span>
      </div>
    );
  }

  if (!product || !paymentData?.pix) {
    logger.error("Erro ao carregar dados do PIX:", { product, paymentData });
    return <div className="text-center text-red-500 mt-10">Erro ao carregar cobrança PIX.</div>;
  }

  logger.log("Rendering PIX payment page with data:", paymentData);

  return (
    <div className="max-w-lg mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Pagamento PIX via Asaas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {qrCodeError ? (
            <div className="text-center text-red-500">{qrCodeError}</div>
          ) : (
            <img
              src={paymentData.pix.qrCodeImage}
              alt="QR Code PIX"
              className="mx-auto w-60 h-60 border rounded"
              onError={(e) => {
                logger.error("Erro ao carregar imagem do QR code:", e);
                setQrCodeError("Erro ao carregar a imagem do QR Code.");
              }}
              onLoad={() => logger.log("Imagem do QR code carregada com sucesso.")}
            />
          )}
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
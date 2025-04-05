import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Copy, ArrowLeft } from 'lucide-react';
import CheckoutContainer from '@/components/checkout/CheckoutContainer';
import { useToast } from '@/hooks/use-toast';

const PixPaymentManual: React.FC = () => {
  const location = useLocation();
  const { toast } = useToast();

  const orderData = location.state?.orderData || {};
  const productName = orderData.productName || 'Produto';
  const pixCode = orderData?.pixDetails?.qrCode || '';
  const qrImage = orderData?.pixDetails?.qrCodeImageUrl || '';

  const handleCopyPixCode = () => {
    if (!pixCode) return;

    navigator.clipboard.writeText(pixCode)
      .then(() => {
        toast({
          title: "Código PIX copiado!",
          description: "O código PIX foi copiado para a área de transferência.",
          duration: 3000,
        });
      })
      .catch((error) => {
        console.error('Erro ao copiar código PIX:', error);
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o código PIX.",
          variant: "destructive",
          duration: 4000,
        });
      });
  };

  return (
    <CheckoutContainer hideHeader hideFooter>
      <div className="max-w-lg mx-auto p-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-xl">Pagamento via PIX</CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col items-center space-y-6">
            {qrImage ? (
              <img src={qrImage} alt="QR Code" className="w-48 h-48 rounded border" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-gray-100 border rounded">
                <QrCode className="w-24 h-24 text-gray-400" />
              </div>
            )}

            <div className="w-full">
              <p className="text-sm text-gray-500 mb-1">Código PIX:</p>
              <div className="flex">
                <div className="flex-1 p-2 bg-gray-100 rounded-l-md border border-gray-300 text-xs overflow-x-auto break-all">
                  {pixCode || 'Código não disponível'}
                </div>
                <Button 
                  onClick={handleCopyPixCode}
                  className="rounded-l-none bg-blue-600 hover:bg-blue-700"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm font-medium">Produto: {productName}</p>
              <p className="text-sm text-gray-500">
                Após o pagamento ser confirmado, enviaremos um e-mail com os detalhes.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button onClick={handleCopyPixCode} className="w-full bg-green-600 hover:bg-green-700">
              Copiar Código PIX
            </Button>

            <Link to="/" className="w-full">
              <Button variant="outline" className="w-full flex items-center justify-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para a Página Inicial
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </CheckoutContainer>
  );
};

export default PixPaymentManual;

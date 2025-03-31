
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CreditCard, QrCode, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import PixPayment from '@/components/checkout/PixPayment';
import CustomerInfoForm, { CustomerData } from '@/components/checkout/CustomerInfoForm';
import AddressForm, { AddressData } from '@/components/checkout/AddressForm';

const Checkout = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');
  const [isSuccess, setIsSuccess] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerData | null>(null);
  const [addressInfo, setAddressInfo] = useState<AddressData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Function to determine product details based on slug
  const getProductDetails = () => {
    // This would come from an API in a real application
    const products = {
      'assinatura-mensal-cineflick-card': {
        name: 'Assinatura Mensal CineFlick',
        price: 19.90,
        description: 'Acesso ilimitado a filmes e séries por 1 mês',
        interval: 'Mensal'
      },
      'product-demo': {
        name: 'Produto Demo',
        price: 120.00,
        description: 'Este é um produto de demonstração',
        interval: 'Único'
      }
    };

    return products[slug as keyof typeof products] || {
      name: slug,
      price: 120.00,
      description: 'Produto não encontrado',
      interval: 'Único'
    };
  };

  const productDetails = getProductDetails();

  // Handle customer info submission
  const handleCustomerInfoChange = (data: CustomerData) => {
    setCustomerInfo(data);
  };

  // Handle address info submission
  const handleAddressInfoChange = (data: AddressData) => {
    setAddressInfo(data);
  };

  // Handle complete checkout submission
  const handleCompleteCheckout = () => {
    if (!customerInfo) {
      toast({
        title: "Informações incompletas",
        description: "Por favor, preencha suas informações pessoais",
        duration: 3000,
      });
      return;
    }

    if (!addressInfo) {
      toast({
        title: "Informações incompletas",
        description: "Por favor, preencha seu endereço",
        duration: 3000,
      });
      return;
    }

    setIsProcessing(true);
    
    // Combine all data for submission
    const completeData = {
      customer: customerInfo,
      address: addressInfo,
      paymentMethod: paymentMethod,
      product: productDetails
    };
    
    // Simulate payment processing
    toast({
      title: "Pagamento recebido",
      description: `Seu pagamento está sendo processado.`,
      duration: 5000,
    });
    
    console.log('Complete payment data:', completeData);
    
    // Simulate success after 1.5 seconds
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-4 md:px-6 border-b">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-blue-600">CineFlick</h1>
          <div className="text-sm text-gray-500">Pagamento Seguro</div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          {isSuccess ? (
            <Card className="border-green-200 shadow-md">
              <CardHeader className="bg-green-50 border-b border-green-100">
                <CardTitle className="text-xl text-green-700 flex items-center">
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Pagamento Confirmado
                </CardTitle>
                <CardDescription className="text-green-600">
                  Seu pagamento foi processado com sucesso
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 pb-4 text-center">
                <div className="rounded-full bg-green-100 p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-medium mb-2">Obrigado pela sua compra!</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Você receberá um email de confirmação em breve com os detalhes da sua compra.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mb-4 max-w-md mx-auto">
                  <h4 className="font-medium text-lg mb-2">Resumo do pedido</h4>
                  <div className="flex justify-between mb-2">
                    <span>Cliente:</span>
                    <span>{customerInfo?.fullName}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Email:</span>
                    <span>{customerInfo?.email}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Produto:</span>
                    <span>{productDetails.name}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Preço:</span>
                    <span className="font-bold">R$ {productDetails.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frequência:</span>
                    <span>{productDetails.interval}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center pt-0 pb-6">
                <button 
                  onClick={() => window.location.href = "/"}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Voltar para início
                </button>
              </CardFooter>
            </Card>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">{productDetails.name}</h2>
                <p className="text-gray-600">{productDetails.description}</p>
                
                <div className="mt-4 bg-blue-50 border border-blue-100 rounded-md p-4 flex items-start">
                  <div className="bg-blue-100 rounded-full p-2 mr-3 mt-1">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Ambiente de Testes</p>
                    <p className="text-sm text-blue-600">
                      Esta é uma página de demonstração. Os pagamentos não serão processados.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  {/* Customer information form - always visible */}
                  <div className="mb-8">
                    <div className="bg-black text-white p-3 mb-4 flex items-center">
                      <span className="inline-flex justify-center items-center w-6 h-6 rounded-full bg-red-600 text-white mr-2">
                        1
                      </span>
                      <h2 className="font-medium text-lg">Informações Pessoais</h2>
                    </div>
                    <CustomerInfoForm 
                      onSubmit={handleCustomerInfoChange} 
                      isCompleted={false} 
                    />
                  </div>
                  
                  {/* Address form - always visible */}
                  <div className="mb-8">
                    <div className="bg-black text-white p-3 mb-4 flex items-center">
                      <span className="inline-flex justify-center items-center w-6 h-6 rounded-full bg-red-600 text-white mr-2">
                        2
                      </span>
                      <h2 className="font-medium text-lg">Endereço de Entrega</h2>
                    </div>
                    <AddressForm
                      onSubmit={handleAddressInfoChange}
                      isCompleted={false}
                    />
                  </div>
                  
                  {/* Payment methods - always visible */}
                  <div>
                    <div className="bg-black text-white p-3 mb-4 flex items-center">
                      <span className="inline-flex justify-center items-center w-6 h-6 rounded-full bg-red-600 text-white mr-2">
                        3
                      </span>
                      <h2 className="font-medium text-lg">Forma de Pagamento</h2>
                    </div>
                    
                    <Tabs 
                      defaultValue="card" 
                      className="w-full"
                      onValueChange={(value) => setPaymentMethod(value as 'card' | 'pix')}
                    >
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="card" className="flex items-center">
                          <CreditCard className="mr-2 h-4 w-4" />
                          <span>Cartão de Crédito</span>
                        </TabsTrigger>
                        <TabsTrigger value="pix" className="flex items-center">
                          <QrCode className="mr-2 h-4 w-4" />
                          <span>PIX</span>
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="card">
                        <div className="mb-6">
                          <CheckoutForm onSubmit={() => {}} />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="pix">
                        <div className="mb-6">
                          <PixPayment onSubmit={() => {}} />
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="mt-8">
                      <Button 
                        onClick={handleCompleteCheckout} 
                        className="w-full py-6 text-lg" 
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Processando pagamento...' : `Pagar R$ ${productDetails.price.toFixed(2)}`}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-1">
                  <Card className="bg-gray-50 border-gray-200 sticky top-6">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Resumo da compra</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 pt-0">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">{productDetails.name}</span>
                          <span>R$ {productDetails.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Frequência</span>
                          <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {productDetails.interval}
                          </span>
                        </div>
                        
                        {addressInfo && (
                          <div className="pt-3 border-t border-gray-200">
                            <h4 className="text-sm font-medium mb-2">Endereço de entrega:</h4>
                            <p className="text-xs text-gray-600">
                              {`${addressInfo.street}, ${addressInfo.number}`}
                              {addressInfo.complement && `, ${addressInfo.complement}`}<br/>
                              {`${addressInfo.neighborhood}, ${addressInfo.city} - ${addressInfo.state}`}<br/>
                              {`CEP: ${addressInfo.cep}`}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-gray-200 my-4"></div>
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span className="text-xl">R$ {productDetails.price.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-4 md:px-6 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:justify-between items-center text-sm text-gray-500">
          <div className="mb-3 md:mb-0">
            &copy; {new Date().getFullYear()} CineFlick. Todos direitos reservados.
          </div>
          <div className="flex items-center space-x-4">
            <a href="#" className="hover:text-gray-700">Termos</a>
            <a href="#" className="hover:text-gray-700">Privacidade</a>
            <a href="#" className="hover:text-gray-700">Ajuda</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Checkout;

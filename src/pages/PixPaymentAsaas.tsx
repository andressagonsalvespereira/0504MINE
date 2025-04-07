import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrders } from '@/contexts/order';
// Removido getOrderById porque não existe ou não está sendo utilizado
import { isConfirmedStatus, isRejectedStatus } from '@/contexts/order/utils/resolveManualStatus';
import { logger } from '@/utils/logger';

const PixPaymentAsaas = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { orders } = useOrders();
  const [order, setOrder] = useState(() =>
    orders.find(o => o.id === Number(orderId))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return navigate('/payment-failed');
    if (!order) {
      logger.error('[PixPaymentAsaas] Pedido não encontrado no contexto e getOrderById não implementado.');
      return navigate('/payment-failed');
    }
  }, [orderId, order, navigate]);

  useEffect(() => {
    if (!order) return;

    const createAsaasCharge = async () => {
      try {
        logger.log('[PixPaymentAsaas] Criando cobrança Asaas para order ID:', order.id);

        const response = await fetch('/.netlify/functions/create-asaas-customer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer_name: order.customer_name,
            customer_email: order.customer_email,
            customer_cpf: order.customer_cpf,
            customer_phone: order.customer_phone,
            product_name: order.product_name,
            price: order.price,
            payment_method: 'PIX',
            order_id: order.id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao criar cobrança');
        }

        logger.log('[PixPaymentAsaas] ✅ Dados recebidos:', data);

        // Aqui você pode salvar o QR Code no state, exibir na tela, etc.
        setLoading(false);
      } catch (error) {
        logger.error('[PixPaymentAsaas] ❌ Erro ao criar cobrança:', error);
        navigate('/payment-failed');
      }
    };

    createAsaasCharge();
  }, [order, navigate]);

  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold">Processando pagamento...</h1>
      <p className="mt-2">Aguarde enquanto geramos sua cobrança PIX.</p>
      {loading && <p className="mt-4 text-sm text-gray-500">Carregando...</p>}
    </div>
  );
};

export default PixPaymentAsaas;

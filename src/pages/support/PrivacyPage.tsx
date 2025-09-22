import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Política de Privacidade
        </h1>
        <p className="mt-4 text-lg text-gray-500">
          Última atualização: 01 de Janeiro de 2023
        </p>
      </div>

      <div className="prose prose-blue prose-lg text-gray-500 mx-auto">
        <h2>1. Introdução</h2>
        <p>
          A VenhaVender está comprometida em proteger sua privacidade. Esta Política de Privacidade explica como coletamos, usamos, 
          divulgamos e protegemos suas informações pessoais quando você utiliza nosso site e serviços.
        </p>

        <h2>2. Informações que Coletamos</h2>
        <p>
          Podemos coletar os seguintes tipos de informações:
        </p>
        <ul>
          <li><strong>Informações de Cadastro:</strong> Nome, endereço de e-mail, número de telefone, endereço e dados de pagamento.</li>
          <li><strong>Informações de Perfil:</strong> Foto de perfil, descrição e preferências.</li>
          <li><strong>Conteúdo Gerado pelo Usuário:</strong> Anúncios, mensagens, avaliações e comentários.</li>
          <li><strong>Informações de Uso:</strong> Como você interage com nosso site, incluindo páginas visitadas, tempo gasto e ações realizadas.</li>
          <li><strong>Informações do Dispositivo:</strong> Tipo de dispositivo, sistema operacional, navegador e endereço IP.</li>
        </ul>

        <h2>3. Como Usamos Suas Informações</h2>
        <p>
          Utilizamos suas informações para:
        </p>
        <ul>
          <li>Fornecer, manter e melhorar nossos serviços;</li>
          <li>Processar transações e enviar notificações relacionadas;</li>
          <li>Personalizar sua experiência e oferecer conteúdo relevante;</li>
          <li>Comunicar-se com você sobre atualizações, promoções e novidades;</li>
          <li>Detectar, prevenir e resolver problemas técnicos e de segurança;</li>
          <li>Cumprir obrigações legais.</li>
        </ul>

        <h2>4. Compartilhamento de Informações</h2>
        <p>
          Podemos compartilhar suas informações com:
        </p>
        <ul>
          <li><strong>Outros Usuários:</strong> Quando você publica anúncios ou envia mensagens, certas informações ficam visíveis para outros usuários.</li>
          <li><strong>Prestadores de Serviços:</strong> Empresas que nos ajudam a fornecer e melhorar nossos serviços (processamento de pagamentos, hospedagem, análise de dados).</li>
          <li><strong>Parceiros Comerciais:</strong> Para oferecer produtos ou serviços conjuntos.</li>
          <li><strong>Autoridades Legais:</strong> Quando exigido por lei ou para proteger direitos e segurança.</li>
        </ul>

        <h2>5. Segurança de Dados</h2>
        <p>
          Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso não autorizado, 
          alteração, divulgação ou destruição. No entanto, nenhum método de transmissão pela internet ou armazenamento eletrônico é 100% seguro.
        </p>

        <h2>6. Seus Direitos</h2>
        <p>
          Você tem direito a:
        </p>
        <ul>
          <li>Acessar e receber uma cópia das suas informações pessoais;</li>
          <li>Retificar informações imprecisas;</li>
          <li>Solicitar a exclusão de suas informações;</li>
          <li>Restringir ou opor-se ao processamento de suas informações;</li>
          <li>Retirar seu consentimento a qualquer momento;</li>
          <li>Apresentar uma reclamação a uma autoridade de proteção de dados.</li>
        </ul>

        <h2>7. Retenção de Dados</h2>
        <p>
          Mantemos suas informações pessoais pelo tempo necessário para fornecer nossos serviços e cumprir nossas obrigações legais. 
          Quando não tivermos mais necessidade legítima de processar suas informações, as excluiremos ou anonimizaremos.
        </p>

        <h2>8. Cookies e Tecnologias Semelhantes</h2>
        <p>
          Utilizamos cookies e tecnologias semelhantes para coletar informações sobre como você interage com nosso site. 
          Você pode configurar seu navegador para recusar todos os cookies ou para indicar quando um cookie está sendo enviado.
        </p>

        <h2>9. Transferências Internacionais</h2>
        <p>
          Suas informações podem ser transferidas e processadas em servidores localizados fora do seu país de residência. 
          Tomaremos medidas para garantir que suas informações recebam um nível adequado de proteção.
        </p>

        <h2>10. Crianças</h2>
        <p>
          Nossos serviços não são direcionados a pessoas menores de 18 anos. Não coletamos intencionalmente informações pessoais de crianças. 
          Se tomarmos conhecimento de que coletamos informações pessoais de uma criança, tomaremos medidas para excluir essas informações.
        </p>

        <h2>11. Alterações nesta Política</h2>
        <p>
          Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre alterações significativas publicando a nova 
          política em nosso site e, quando exigido por lei, obteremos seu consentimento.
        </p>

        <h2>12. Contato</h2>
        <p>
          Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco pelo e-mail: privacidade@venhavender.com.br
        </p>
      </div>
    </div>
  );
}
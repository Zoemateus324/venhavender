import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Termos de Uso
        </h1>
        <p className="mt-4 text-lg text-gray-500">
          Última atualização: 01 de Janeiro de 2023
        </p>
      </div>

      <div className="prose prose-blue prose-lg text-gray-500 mx-auto">
        <h2>1. Aceitação dos Termos</h2>
        <p>
          Ao acessar e usar o site e os serviços da VenhaVender, você concorda em cumprir e ficar vinculado aos seguintes termos e condições. 
          Se você não concordar com qualquer parte destes termos, não poderá acessar ou usar nossos serviços.
        </p>

        <h2>2. Descrição do Serviço</h2>
        <p>
          A VenhaVender é uma plataforma online que permite aos usuários publicar anúncios de produtos e serviços para venda, 
          bem como navegar e entrar em contato com outros usuários sobre os itens anunciados.
        </p>

        <h2>3. Cadastro e Conta</h2>
        <p>
          Para utilizar completamente nossos serviços, você precisa se registrar e criar uma conta. Você é responsável por manter a confidencialidade 
          de suas credenciais de login e por todas as atividades que ocorrem em sua conta. Você concorda em notificar imediatamente a VenhaVender sobre 
          qualquer uso não autorizado de sua conta ou qualquer outra violação de segurança.
        </p>

        <h2>4. Conteúdo do Usuário</h2>
        <p>
          Ao publicar anúncios ou qualquer outro conteúdo em nossa plataforma, você garante que:
        </p>
        <ul>
          <li>Possui todos os direitos necessários sobre o conteúdo que está publicando;</li>
          <li>O conteúdo é preciso e não enganoso;</li>
          <li>O conteúdo não viola estes termos, leis aplicáveis ou direitos de terceiros;</li>
          <li>O conteúdo não contém material ofensivo, difamatório, discriminatório ou ilegal.</li>
        </ul>

        <h2>5. Conduta Proibida</h2>
        <p>
          Você concorda em não usar nossos serviços para:
        </p>
        <ul>
          <li>Publicar conteúdo ilegal, fraudulento, enganoso ou prejudicial;</li>
          <li>Vender produtos ou serviços ilegais ou proibidos;</li>
          <li>Violar direitos de propriedade intelectual;</li>
          <li>Coletar informações de usuários sem consentimento;</li>
          <li>Interferir no funcionamento adequado da plataforma;</li>
          <li>Distribuir malware ou realizar ataques de segurança.</li>
        </ul>

        <h2>6. Taxas e Pagamentos</h2>
        <p>
          Alguns serviços da VenhaVender podem estar sujeitos a taxas. Quando aplicável, as taxas serão claramente comunicadas antes da utilização 
          do serviço. Você concorda em pagar todas as taxas aplicáveis e autoriza a VenhaVender a cobrar usando os métodos de pagamento fornecidos.
        </p>

        <h2>7. Propriedade Intelectual</h2>
        <p>
          Todo o conteúdo fornecido pela VenhaVender, incluindo logotipos, marcas comerciais, textos, gráficos, interfaces de usuário e código de 
          computador, é propriedade da VenhaVender ou de seus licenciadores e está protegido por leis de propriedade intelectual.
        </p>

        <h2>8. Limitação de Responsabilidade</h2>
        <p>
          A VenhaVender não é responsável por transações entre usuários. Atuamos apenas como uma plataforma para conectar compradores e vendedores. 
          Não garantimos a qualidade, segurança ou legalidade dos itens anunciados ou a veracidade das informações fornecidas pelos usuários.
        </p>

        <h2>9. Modificações dos Termos</h2>
        <p>
          Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor após a publicação dos termos atualizados 
          em nosso site. O uso continuado de nossos serviços após tais alterações constitui sua aceitação dos novos termos.
        </p>

        <h2>10. Rescisão</h2>
        <p>
          Podemos encerrar ou suspender sua conta e acesso aos nossos serviços a qualquer momento, por qualquer motivo, sem aviso prévio ou responsabilidade.
        </p>

        <h2>11. Lei Aplicável</h2>
        <p>
          Estes termos serão regidos e interpretados de acordo com as leis do Brasil, sem considerar suas disposições de conflito de leis.
        </p>

        <h2>12. Contato</h2>
        <p>
          Se você tiver alguma dúvida sobre estes Termos de Uso, entre em contato conosco pelo e-mail: termos@venhavender.com.br
        </p>
      </div>
    </div>
  );
}
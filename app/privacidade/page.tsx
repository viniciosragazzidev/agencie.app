import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de Privacidade | Agencie",
  description: "Política de privacidade e proteção de dados da plataforma Agencie",
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-foreground hover:text-primary transition-colors">
            Agencie
          </a>
          <nav className="flex items-center gap-6">
            <a href="/termos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Termos de Uso
            </a>
            <a href="/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Entrar
            </a>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-4xl mx-auto px-4 py-12 md:py-16 lg:py-20">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Política de Privacidade
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Última atualização: 26 de junho de 2026
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introdução</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                A Agencie ("nós", "nosso" ou "nos") está comprometida em proteger sua privacidade. Esta Política de Privacidade 
                explica como coletamos, usamos, divulgamos e protegemos suas informações quando você usa nossa plataforma de 
                gestão para agências de marketing digital.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed mt-4">
                Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e 
                outras leis aplicáveis de proteção de dados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Informações que Coletamos</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">2.1 Informações que Você Fornece</h3>
              <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground">
                <li><strong>Informações de Conta:</strong> Nome, email, senha, telefone, foto de perfil</li>
                <li><strong>Informações da Agência:</strong> Nome da empresa, CNPJ, endereço, site</li>
                <li><strong>Informações de Clientes:</strong> Dados dos clientes que você gerencia através da plataforma</li>
                <li><strong>Informações de Pagamento:</strong> Dados de cartão de crédito (processados por terceiros seguros)</li>
                <li><strong>Conteúdo:</strong> Projetos, campanhas, comunicações, arquivos e documentos que você cria ou carrega</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">2.2 Informações Coletadas Automaticamente</h3>
              <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground">
                <li><strong>Informações de Uso:</strong> Páginas visitadas, recursos utilizados, ações realizadas</li>
                <li><strong>Informações do Dispositivo:</strong> Tipo de dispositivo, sistema operacional, navegador, endereço IP</li>
                <li><strong>Cookies e Tecnologias Similares:</strong> Para melhorar a experiência e funcionalidade</li>
                <li><strong>Logs do Sistema:</strong> Registros de atividades para segurança e diagnóstico</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">2.3 Informações de Terceiros</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Podemos receber informações quando você conecta serviços de terceiros à nossa plataforma, como:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground mt-2">
                <li>Meta Ads (Facebook e Instagram)</li>
                <li>Google Ads e Google Analytics</li>
                <li>WhatsApp Business API</li>
                <li>Outras integrações de marketing digital</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Como Usamos Suas Informações</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                Usamos as informações coletadas para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground">
                <li>Fornecer, operar e manter nossa plataforma</li>
                <li>Processar transações e gerenciar assinaturas</li>
                <li>Enviar comunicações importantes sobre o serviço</li>
                <li>Responder a solicitações de suporte ao cliente</li>
                <li>Melhorar e personalizar sua experiência</li>
                <li>Analisar o uso da plataforma e desenvolver novos recursos</li>
                <li>Detectar, prevenir e resolver problemas técnicos e de segurança</li>
                <li>Cumprir obrigações legais e regulatórias</li>
                <li>Enviar atualizações de produtos e ofertas (com seu consentimento)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Base Legal para Processamento (LGPD)</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                Processamos seus dados pessoais com base em:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground">
                <li><strong>Execução de Contrato:</strong> Para fornecer o serviço que você contratou</li>
                <li><strong>Consentimento:</strong> Quando você nos autoriza explicitamente</li>
                <li><strong>Interesse Legítimo:</strong> Para melhorar nossos serviços e segurança</li>
                <li><strong>Obrigação Legal:</strong> Para cumprir requisitos legais e regulatórios</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Compartilhamento de Informações</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                Não vendemos suas informações pessoais. Podemos compartilhar seus dados apenas com:
              </p>
              
              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">5.1 Provedores de Serviços</h3>
              <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground">
                <li>Processadores de pagamento (Stripe, etc.)</li>
                <li>Provedores de hospedagem e infraestrutura</li>
                <li>Serviços de email e comunicação</li>
                <li>Ferramentas de análise e monitoramento</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">5.2 Requisitos Legais</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Podemos divulgar informações se exigido por lei, ordem judicial, processo legal ou solicitação governamental.
              </p>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">5.3 Proteção de Direitos</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Para proteger nossos direitos, propriedade ou segurança, ou de nossos usuários e do público.
              </p>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">5.4 Transações Comerciais</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Em caso de fusão, aquisição ou venda de ativos, suas informações podem ser transferidas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Seus Direitos (LGPD)</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                De acordo com a LGPD, você tem os seguintes direitos sobre seus dados pessoais:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground">
                <li><strong>Confirmação e Acesso:</strong> Confirmar se processamos seus dados e acessá-los</li>
                <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li><strong>Anonimização, Bloqueio ou Eliminação:</strong> De dados desnecessários, excessivos ou tratados em desconformidade</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado e interoperável</li>
                <li><strong>Eliminação:</strong> Excluir dados tratados com base em consentimento</li>
                <li><strong>Informação sobre Compartilhamento:</strong> Saber com quem compartilhamos seus dados</li>
                <li><strong>Revogação de Consentimento:</strong> Retirar seu consentimento a qualquer momento</li>
                <li><strong>Oposição:</strong> Opor-se ao tratamento de dados</li>
              </ul>
              <p className="text-base text-muted-foreground leading-relaxed mt-4">
                Para exercer seus direitos, entre em contato através de: <strong>privacidade@agencie.app</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Segurança dos Dados</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                Implementamos medidas técnicas e organizacionais apropriadas para proteger suas informações:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground">
                <li>Criptografia de dados em trânsito (HTTPS/TLS) e em repouso</li>
                <li>Controles de acesso rigorosos e autenticação multi-fator</li>
                <li>Monitoramento e registro de atividades de segurança</li>
                <li>Backups regulares e planos de recuperação de desastres</li>
                <li>Auditorias de segurança periódicas</li>
                <li>Treinamento de funcionários sobre privacidade e segurança</li>
              </ul>
              <p className="text-base text-muted-foreground leading-relaxed mt-4">
                Apesar de nossos esforços, nenhum método de transmissão ou armazenamento eletrônico é 100% seguro. 
                Não podemos garantir segurança absoluta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Retenção de Dados</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Mantemos suas informações pessoais pelo tempo necessário para cumprir os propósitos descritos nesta política, 
                a menos que um período de retenção mais longo seja exigido ou permitido por lei. Após o término da relação, 
                seus dados serão excluídos ou anonimizados de forma segura, exceto quando necessário manter por obrigação legal.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Transferência Internacional de Dados</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Seus dados podem ser transferidos e mantidos em servidores localizados fora do Brasil. Quando isso ocorre, 
                garantimos que medidas adequadas de proteção estejam em vigor, em conformidade com a LGPD, incluindo cláusulas 
                contratuais padrão e certificações de privacidade.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Cookies e Tecnologias de Rastreamento</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                Usamos cookies e tecnologias similares para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground">
                <li><strong>Cookies Essenciais:</strong> Necessários para o funcionamento básico da plataforma</li>
                <li><strong>Cookies de Funcionalidade:</strong> Lembrar suas preferências e configurações</li>
                <li><strong>Cookies de Análise:</strong> Entender como você usa nossa plataforma</li>
                <li><strong>Cookies de Marketing:</strong> Personalizar anúncios (somente com seu consentimento)</li>
              </ul>
              <p className="text-base text-muted-foreground leading-relaxed mt-4">
                Você pode gerenciar suas preferências de cookies através das configurações do navegador ou da nossa 
                ferramenta de gerenciamento de cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Privacidade de Menores</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Nossa plataforma não é destinada a menores de 18 anos. Não coletamos intencionalmente informações de 
                menores. Se você acredita que coletamos informações de um menor, entre em contato conosco imediatamente 
                para que possamos excluir essas informações.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Links para Sites de Terceiros</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Nossa plataforma pode conter links para sites de terceiros. Não somos responsáveis pelas práticas de 
                privacidade desses sites. Recomendamos que você leia as políticas de privacidade de cada site que visita.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">13. Alterações a Esta Política</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas 
                por email ou através de um aviso destacado em nossa plataforma. A data da "Última atualização" no topo desta 
                página indica quando a política foi revisada pela última vez.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">14. Encarregado de Proteção de Dados (DPO)</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Nosso Encarregado de Proteção de Dados está disponível para esclarecer dúvidas sobre esta política e 
                sobre o tratamento de seus dados pessoais:
              </p>
              <div className="mt-4 space-y-2 text-base text-muted-foreground">
                <p><strong>Email:</strong> dpo@agencie.app</p>
                <p><strong>Email Alternativo:</strong> privacidade@agencie.app</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">15. Autoridade Nacional de Proteção de Dados (ANPD)</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Se você não estiver satisfeito com nossa resposta às suas solicitações de privacidade, você tem o direito 
                de apresentar uma reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
              </p>
              <div className="mt-4 space-y-2 text-base text-muted-foreground">
                <p><strong>Website:</strong> https://www.gov.br/anpd/</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">16. Contato</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                Para questões sobre esta Política de Privacidade ou sobre o tratamento de seus dados pessoais, 
                entre em contato:
              </p>
              <div className="space-y-2 text-base text-muted-foreground">
                <p><strong>Email:</strong> privacidade@agencie.app</p>
                <p><strong>Suporte:</strong> suporte@agencie.app</p>
                <p><strong>Website:</strong> https://agencie.app</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-16">
        <div className="container max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 Agencie. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6">
              <a href="/termos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Termos de Uso
              </a>
              <a href="/privacidade" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacidade
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

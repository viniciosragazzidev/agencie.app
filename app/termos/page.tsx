import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Termos de Uso | Agencie",
  description: "Termos e condições de uso da plataforma Agencie",
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-foreground hover:text-primary transition-colors">
            Agencie
          </a>
          <nav className="flex items-center gap-6">
            <a href="/privacidade" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacidade
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
            Termos de Uso
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Última atualização: 26 de junho de 2026
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Aceitação dos Termos</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Ao acessar e usar a plataforma Agencie ("Serviço"), você concorda em estar vinculado a estes Termos de Uso. 
                Se você não concorda com alguma parte destes termos, não deve usar nosso Serviço.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Descrição do Serviço</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                O Agencie é uma plataforma de gestão para agências de marketing digital que oferece:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground">
                <li>Gestão de clientes e projetos</li>
                <li>Portal do cliente personalizado</li>
                <li>Gerenciamento de campanhas publicitárias</li>
                <li>Sistema de inbox e comunicação</li>
                <li>Relatórios e análises de performance</li>
                <li>Integrações com plataformas de mídia social</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Registro e Conta</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                Para utilizar o Serviço, você deve:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground">
                <li>Fornecer informações precisas e completas durante o registro</li>
                <li>Manter a segurança de sua senha e conta</li>
                <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
                <li>Ter pelo menos 18 anos de idade</li>
                <li>Ser responsável por todas as atividades realizadas em sua conta</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Uso Aceitável</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                Você concorda em não usar o Serviço para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground">
                <li>Violar qualquer lei ou regulamento aplicável</li>
                <li>Infringir direitos de propriedade intelectual de terceiros</li>
                <li>Transmitir vírus, malware ou código malicioso</li>
                <li>Coletar dados de outros usuários sem consentimento</li>
                <li>Interferir ou interromper o funcionamento do Serviço</li>
                <li>Realizar engenharia reversa ou tentar acessar código-fonte</li>
                <li>Revender ou redistribuir o Serviço sem autorização expressa</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Propriedade Intelectual</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                O Serviço e seu conteúdo original, recursos e funcionalidades são de propriedade exclusiva do Agencie 
                e são protegidos por leis de direitos autorais, marcas registradas e outras leis de propriedade intelectual.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                Você mantém todos os direitos sobre o conteúdo que você carrega, publica ou exibe no Serviço. 
                Ao enviar conteúdo, você nos concede uma licença mundial, não exclusiva e livre de royalties para usar, 
                reproduzir e exibir esse conteúdo exclusivamente para fornecer o Serviço.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Pagamentos e Assinaturas</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                Alguns aspectos do Serviço são fornecidos mediante pagamento. Você concorda em:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground">
                <li>Fornecer informações de pagamento atuais, completas e precisas</li>
                <li>Pagar todas as taxas conforme descrito em seu plano de assinatura</li>
                <li>Atualizar suas informações de pagamento conforme necessário</li>
                <li>Estar ciente de que as assinaturas são renovadas automaticamente</li>
              </ul>
              <p className="text-base text-muted-foreground leading-relaxed mt-4">
                Você pode cancelar sua assinatura a qualquer momento através das configurações da conta. 
                O cancelamento entrará em vigor no final do período de cobrança atual.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Política de Reembolso</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Oferecemos reembolso total dentro de 7 dias após a primeira cobrança de uma nova assinatura. 
                Após esse período, os pagamentos não são reembolsáveis, mas você pode cancelar a qualquer momento 
                para evitar cobranças futuras.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Privacidade e Dados</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Seu uso do Serviço também é regido por nossa{" "}
                <a href="/privacidade" className="text-primary hover:underline">
                  Política de Privacidade
                </a>
                , que descreve como coletamos, usamos e protegemos suas informações pessoais.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Limitação de Responsabilidade</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-4">
                O Serviço é fornecido "como está" e "conforme disponível". Na máxima extensão permitida por lei, 
                o Agencie não oferece garantias, expressas ou implícitas, quanto ao Serviço.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                Em nenhuma circunstância o Agencie será responsável por quaisquer danos indiretos, incidentais, 
                especiais, consequenciais ou punitivos, incluindo perda de lucros, dados, uso ou outras perdas intangíveis.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Indenização</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Você concorda em indenizar e isentar o Agencie, seus diretores, funcionários e agentes de qualquer 
                reivindicação, dano, obrigação, perda, responsabilidade, custo ou dívida e despesas decorrentes de:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground mt-4">
                <li>Seu uso e acesso ao Serviço</li>
                <li>Violação destes Termos de Uso</li>
                <li>Violação de direitos de terceiros, incluindo propriedade intelectual</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Modificações do Serviço</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Reservamos o direito de modificar ou descontinuar, temporária ou permanentemente, o Serviço 
                (ou qualquer parte dele) com ou sem aviso prévio. Não seremos responsáveis perante você ou 
                terceiros por qualquer modificação, suspensão ou descontinuação do Serviço.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Alterações aos Termos</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Podemos revisar estes Termos de Uso periodicamente. A data da "Última atualização" no topo desta 
                página indica quando estes termos foram revisados pela última vez. Seu uso continuado do Serviço 
                após quaisquer alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">13. Rescisão</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Podemos encerrar ou suspender sua conta e acesso ao Serviço imediatamente, sem aviso prévio ou 
                responsabilidade, por qualquer motivo, incluindo violação destes Termos de Uso. Após a rescisão, 
                seu direito de usar o Serviço cessará imediatamente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">14. Lei Aplicável</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Estes Termos serão regidos e interpretados de acordo com as leis do Brasil, sem considerar 
                suas disposições sobre conflitos de leis. Qualquer disputa relacionada a estes Termos será 
                resolvida nos tribunais competentes do Brasil.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">15. Contato</h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Se você tiver alguma dúvida sobre estes Termos de Uso, entre em contato conosco:
              </p>
              <div className="mt-4 space-y-2 text-base text-muted-foreground">
                <p>Email: suporte@agencie.app</p>
                <p>Website: https://agencie.app</p>
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

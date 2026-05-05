import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Scale, 
  BookOpen, 
  UserPlus, 
  MousePointerClick, 
  AlertTriangle, 
  BrainCircuit, 
  Activity, 
  ShieldAlert, 
  HardDrive, 
  RefreshCw, 
  UserMinus, 
  Copyright, 
  Gavel, 
  FileCheck 
} from 'lucide-react';

const TermsOfServicePage = () => {
  const [lang, setLang] = useState('en');

  const content = {
    en: {
      title: 'Terms of Service',
      subtitle: 'Last updated: March 23, 2026',
      sections: [
        {
          id: 1,
          title: '1. Scope of Application',
          icon: <Scale className="w-5 h-5 text-primary" />,
          content: (
            <p>
              These Terms of Service apply to the use of the "Marc's Trading Journal" application. By registering and using the platform, you agree to these terms. Deviating conditions of the user are not recognized unless expressly agreed to in writing.
            </p>
          ),
        },
        {
          id: 2,
          title: '2. Service Description',
          icon: <BookOpen className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Marc's Trading Journal is a digital platform for recording, analyzing, and managing trading activities. The service includes features for logging trades, calculating performance metrics, and generating visual analytics. The platform is provided "as is" and we reserve the right to modify, expand, or discontinue features at any time.
            </p>
          ),
        },
        {
          id: 3,
          title: '3. Registration and User Account',
          icon: <UserPlus className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Use of the platform requires the creation of a user account. You are obligated to provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.
            </p>
          ),
        },
        {
          id: 4,
          title: '4. Platform Usage',
          icon: <MousePointerClick className="w-5 h-5 text-primary" />,
          content: (
            <p>
              You agree to use the platform only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the platform. Automated scraping, data mining, or any action that imposes an unreasonable load on our infrastructure is strictly prohibited.
            </p>
          ),
        },
        {
          id: 5,
          title: '5. No Investment Advice',
          icon: <AlertTriangle className="w-5 h-5 text-primary" />,
          content: (
            <p>
              <strong>Important:</strong> The platform, including all its analytics and AI-generated insights, does not constitute financial, investment, or trading advice. All data and analysis are for informational and educational purposes only. You are solely responsible for your own trading decisions and any resulting financial losses.
            </p>
          ),
        },
        {
          id: 6,
          title: '6. AI-Powered Analysis',
          icon: <BrainCircuit className="w-5 h-5 text-primary" />,
          content: (
            <p>
              The platform may utilize artificial intelligence to provide insights or summarize trading data. These AI-generated outputs are based on historical data and statistical models. They are not guarantees of future performance and should not be relied upon as definitive trading signals.
            </p>
          ),
        },
        {
          id: 7,
          title: '7. Platform Availability',
          icon: <Activity className="w-5 h-5 text-primary" />,
          content: (
            <p>
              We strive to ensure high availability of the platform but do not guarantee uninterrupted access. The service may be temporarily unavailable due to maintenance, updates, or technical issues beyond our control. We are not liable for any losses incurred due to platform downtime.
            </p>
          ),
        },
        {
          id: 8,
          title: '8. Liability',
          icon: <ShieldAlert className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Our liability is limited to intent and gross negligence. We are not liable for indirect damages, consequential damages, or lost profits resulting from the use or inability to use the platform. This limitation of liability applies to the fullest extent permitted by law.
            </p>
          ),
        },
        {
          id: 9,
          title: '9. Data and Data Loss',
          icon: <HardDrive className="w-5 h-5 text-primary" />,
          content: (
            <p>
              While we perform regular backups, you are responsible for maintaining your own copies of your trading data (e.g., via the CSV export feature). We assume no liability for the accidental loss, corruption, or alteration of data entered into the platform.
            </p>
          ),
        },
        {
          id: 10,
          title: '10. Changes to Services',
          icon: <RefreshCw className="w-5 h-5 text-primary" />,
          content: (
            <p>
              We reserve the right to modify these Terms of Service and the features of the platform at any time. Users will be notified of significant changes. Continued use of the platform after such modifications constitutes acceptance of the updated terms.
            </p>
          ),
        },
        {
          id: 11,
          title: '11. Termination and Deletion',
          icon: <UserMinus className="w-5 h-5 text-primary" />,
          content: (
            <p>
              You may terminate your account at any time. Upon deletion, all your personal and trading data will be permanently removed from our active servers within 30 days. We reserve the right to suspend or terminate accounts that violate these Terms of Service.
            </p>
          ),
        },
        {
          id: 12,
          title: '12. Copyright and Usage Rights',
          icon: <Copyright className="w-5 h-5 text-primary" />,
          content: (
            <p>
              All content, design, and software code of the platform are protected by copyright. You are granted a limited, non-exclusive, non-transferable right to use the platform for its intended purpose. Reproduction or distribution of platform elements without permission is prohibited.
            </p>
          ),
        },
        {
          id: 13,
          title: '13. Applicable Law',
          icon: <Gavel className="w-5 h-5 text-primary" />,
          content: (
            <p>
              These Terms of Service and the legal relationship between the user and the platform are governed by the laws of the Federal Republic of Germany, excluding the UN Convention on Contracts for the International Sale of Goods (CISG).
            </p>
          ),
        },
        {
          id: 14,
          title: '14. Severability Clause',
          icon: <FileCheck className="w-5 h-5 text-primary" />,
          content: (
            <p>
              If any provision of these Terms of Service is or becomes invalid or unenforceable, the validity of the remaining provisions shall not be affected. The invalid provision shall be replaced by a valid one that comes closest to the intended economic purpose.
            </p>
          ),
        },
      ],
    },
    de: {
      title: 'Nutzungsbedingungen',
      subtitle: 'Zuletzt aktualisiert: 23. März 2026',
      sections: [
        {
          id: 1,
          title: '1. Geltungsbereich',
          icon: <Scale className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Diese Nutzungsbedingungen gelten für die Nutzung der Anwendung "Marc's Trading Journal". Mit der Registrierung und Nutzung der Plattform stimmen Sie diesen Bedingungen zu. Abweichende Bedingungen des Nutzers werden nicht anerkannt, es sei denn, es wurde ausdrücklich schriftlich zugestimmt.
            </p>
          ),
        },
        {
          id: 2,
          title: '2. Leistungsbeschreibung',
          icon: <BookOpen className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Marc's Trading Journal ist eine digitale Plattform zur Erfassung, Analyse und Verwaltung von Handelsaktivitäten. Der Service umfasst Funktionen zur Protokollierung von Trades, Berechnung von Leistungskennzahlen und Erstellung visueller Analysen. Die Plattform wird "wie besehen" bereitgestellt und wir behalten uns das Recht vor, Funktionen jederzeit zu ändern, zu erweitern oder einzustellen.
            </p>
          ),
        },
        {
          id: 3,
          title: '3. Registrierung und Nutzerkonto',
          icon: <UserPlus className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Die Nutzung der Plattform erfordert die Erstellung eines Nutzerkontos. Sie sind verpflichtet, bei der Registrierung genaue und vollständige Angaben zu machen. Sie sind für die Wahrung der Vertraulichkeit Ihrer Zugangsdaten und für alle Aktivitäten, die unter Ihrem Konto stattfinden, verantwortlich.
            </p>
          ),
        },
        {
          id: 4,
          title: '4. Nutzung der Plattform',
          icon: <MousePointerClick className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Sie verpflichten sich, die Plattform nur für rechtmäßige Zwecke zu nutzen und in einer Weise, die die Rechte anderer nicht verletzt oder deren Nutzung und Genuss der Plattform einschränkt. Automatisiertes Scraping, Data Mining oder jegliche Handlung, die unsere Infrastruktur unangemessen belastet, ist strengstens untersagt.
            </p>
          ),
        },
        {
          id: 5,
          title: '5. Keine Anlageberatung',
          icon: <AlertTriangle className="w-5 h-5 text-primary" />,
          content: (
            <p>
              <strong>Wichtig:</strong> Die Plattform, einschließlich all ihrer Analysen und KI-generierten Erkenntnisse, stellt keine Finanz-, Anlage- oder Handelsberatung dar. Alle Daten und Analysen dienen ausschließlich Informations- und Bildungszwecken. Sie sind allein verantwortlich für Ihre eigenen Handelsentscheidungen und daraus resultierende finanzielle Verluste.
            </p>
          ),
        },
        {
          id: 6,
          title: '6. KI-gestützte Auswertungen',
          icon: <BrainCircuit className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Die Plattform kann künstliche Intelligenz nutzen, um Erkenntnisse zu liefern oder Handelsdaten zusammenzufassen. Diese KI-generierten Ausgaben basieren auf historischen Daten und statistischen Modellen. Sie sind keine Garantien für zukünftige Leistungen und sollten nicht als definitive Handelssignale herangezogen werden.
            </p>
          ),
        },
        {
          id: 7,
          title: '7. Verfügbarkeit der Plattform',
          icon: <Activity className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Wir bemühen uns um eine hohe Verfügbarkeit der Plattform, garantieren jedoch keinen ununterbrochenen Zugang. Der Service kann aufgrund von Wartungsarbeiten, Updates oder technischen Problemen außerhalb unserer Kontrolle vorübergehend nicht verfügbar sein. Wir haften nicht für Verluste, die durch Ausfallzeiten der Plattform entstehen.
            </p>
          ),
        },
        {
          id: 8,
          title: '8. Haftung',
          icon: <ShieldAlert className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Unsere Haftung ist auf Vorsatz und grobe Fahrlässigkeit beschränkt. Wir haften nicht für indirekte Schäden, Folgeschäden oder entgangenen Gewinn, die aus der Nutzung oder der Unmöglichkeit der Nutzung der Plattform resultieren. Diese Haftungsbeschränkung gilt im weitestmöglichen gesetzlich zulässigen Umfang.
            </p>
          ),
        },
        {
          id: 9,
          title: '9. Daten und Datenverlust',
          icon: <HardDrive className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Obwohl wir regelmäßige Backups durchführen, sind Sie dafür verantwortlich, eigene Kopien Ihrer Handelsdaten aufzubewahren (z. B. über die CSV-Exportfunktion). Wir übernehmen keine Haftung für den versehentlichen Verlust, die Beschädigung oder die Veränderung von Daten, die in die Plattform eingegeben wurden.
            </p>
          ),
        },
        {
          id: 10,
          title: '10. Änderungen der Leistungen',
          icon: <RefreshCw className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Wir behalten uns das Recht vor, diese Nutzungsbedingungen und die Funktionen der Plattform jederzeit zu ändern. Nutzer werden über wesentliche Änderungen informiert. Die fortgesetzte Nutzung der Plattform nach solchen Änderungen stellt die Annahme der aktualisierten Bedingungen dar.
            </p>
          ),
        },
        {
          id: 11,
          title: '11. Kündigung und Löschung',
          icon: <UserMinus className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Sie können Ihr Konto jederzeit kündigen. Nach der Löschung werden alle Ihre persönlichen und Handelsdaten innerhalb von 30 Tagen dauerhaft von unseren aktiven Servern entfernt. Wir behalten uns das Recht vor, Konten zu sperren oder zu kündigen, die gegen diese Nutzungsbedingungen verstoßen.
            </p>
          ),
        },
        {
          id: 12,
          title: '12. Urheberrecht und Nutzungsrechte',
          icon: <Copyright className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Alle Inhalte, das Design und der Softwarecode der Plattform sind urheberrechtlich geschützt. Ihnen wird ein begrenztes, nicht exklusives, nicht übertragbares Recht eingeräumt, die Plattform für ihren vorgesehenen Zweck zu nutzen. Die Vervielfältigung oder Verbreitung von Plattformelementen ohne Genehmigung ist untersagt.
            </p>
          ),
        },
        {
          id: 13,
          title: '13. Anwendbares Recht',
          icon: <Gavel className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Diese Nutzungsbedingungen und die Rechtsbeziehung zwischen dem Nutzer und der Plattform unterliegen dem Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG).
            </p>
          ),
        },
        {
          id: 14,
          title: '14. Salvatorische Klausel',
          icon: <FileCheck className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Sollte eine Bestimmung dieser Nutzungsbedingungen unwirksam oder undurchführbar sein oder werden, so wird die Gültigkeit der übrigen Bestimmungen hiervon nicht berührt. Die unwirksame Bestimmung ist durch eine wirksame zu ersetzen, die dem angestrebten wirtschaftlichen Zweck am nächsten kommt.
            </p>
          ),
        },
      ],
    },
  };

  const currentContent = content[lang];

  return (
    <>
      <Helmet>
        <title>{`${currentContent.title} - Trading Journal`}</title>
        <meta name="description" content="Terms of Service and Platform Usage Rules" />
      </Helmet>

      <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header & Toggle */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">{currentContent.title}</h1>
              <p className="text-muted-foreground">{currentContent.subtitle}</p>
            </div>
            <div className="flex items-center bg-muted p-1 rounded-lg border border-border/50 shadow-sm">
              <Button
                variant={lang === 'de' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLang('de')}
                className={`rounded-md px-4 transition-all ${lang === 'de' ? 'shadow-sm' : ''}`}
              >
                DE
              </Button>
              <Button
                variant={lang === 'en' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLang('en')}
                className={`rounded-md px-4 transition-all ${lang === 'en' ? 'shadow-sm' : ''}`}
              >
                EN
              </Button>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={lang}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {currentContent.sections.map((section) => (
                  <Card key={section.id} className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <CardContent className="p-6 sm:p-8">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 bg-primary/10 p-2 rounded-lg shrink-0">
                          {section.icon}
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl font-semibold mb-4 text-foreground tracking-tight">
                            {section.title}
                          </h2>
                          <div className="text-muted-foreground leading-relaxed prose prose-sm sm:prose-base dark:prose-invert max-w-none">
                            {section.content}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Note */}
          <div className="mt-16 text-center text-sm text-muted-foreground">
            <p>
              {lang === 'en' 
                ? 'If you have any questions about these Terms of Service, please contact us.'
                : 'Wenn Sie Fragen zu diesen Nutzungsbedingungen haben, kontaktieren Sie uns bitte.'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsOfServicePage;
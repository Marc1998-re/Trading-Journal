import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Wrench, 
  ShieldQuestion, 
  UserCheck, 
  TrendingDown, 
  Scale, 
  Activity, 
  Briefcase 
} from 'lucide-react';

const DisclaimerPage = () => {
  const [lang, setLang] = useState('en');

  const content = {
    en: {
      title: 'Disclaimer',
      subtitle: 'Last updated: March 23, 2026',
      sections: [
        {
          id: 1,
          title: '1. No Investment Advice',
          icon: <AlertTriangle className="w-5 h-5 text-primary" />,
          content: (
            <p>
              The information, analysis, and tools provided on Marc's Trading Journal do not constitute financial, investment, trading, or any other type of professional advice. All content is for informational and educational purposes only. You should not make any financial decisions based solely on the information provided by this platform.
            </p>
          ),
        },
        {
          id: 2,
          title: '2. Pure Tool and Analysis Character',
          icon: <Wrench className="w-5 h-5 text-primary" />,
          content: (
            <p>
              This platform is designed strictly as a software tool to help users log, track, and analyze their own trading activities. Any metrics, charts, or AI-generated insights are derived from the data you input and are intended to assist in self-reflection and strategy evaluation, not to predict future market movements.
            </p>
          ),
        },
        {
          id: 3,
          title: '3. No Warranty for Accuracy and Completeness',
          icon: <ShieldQuestion className="w-5 h-5 text-primary" />,
          content: (
            <p>
              While we strive to ensure the platform functions correctly, we make no warranties or representations regarding the accuracy, completeness, reliability, or timeliness of any calculations, data exports, or analytical outputs. Software bugs or data processing errors may occur.
            </p>
          ),
        },
        {
          id: 4,
          title: '4. User Responsibility',
          icon: <UserCheck className="w-5 h-5 text-primary" />,
          content: (
            <p>
              You are solely responsible for your own trading decisions and the consequences thereof. By using this platform, you acknowledge that trading in financial markets involves a high degree of risk and that you may lose some or all of your invested capital.
            </p>
          ),
        },
        {
          id: 5,
          title: '5. No Success Guarantee',
          icon: <TrendingDown className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Past performance, whether simulated, tracked, or analyzed on this platform, is not indicative of future results. The use of a trading journal or analytical tools does not guarantee profitability or success in trading.
            </p>
          ),
        },
        {
          id: 6,
          title: '6. Liability Limitation',
          icon: <Scale className="w-5 h-5 text-primary" />,
          content: (
            <p>
              To the maximum extent permitted by applicable law, Marc Reinhardt and the operators of this platform shall not be liable for any direct, indirect, incidental, consequential, or punitive damages, including but not limited to financial losses, arising out of your use of or inability to use the platform.
            </p>
          ),
        },
        {
          id: 7,
          title: '7. Platform Availability',
          icon: <Activity className="w-5 h-5 text-primary" />,
          content: (
            <p>
              We do not guarantee that the platform will be available at all times without interruption. Access may be suspended temporarily and without notice in the case of system failure, maintenance, repair, or for reasons beyond our control.
            </p>
          ),
        },
        {
          id: 8,
          title: '8. No Professional Advice',
          icon: <Briefcase className="w-5 h-5 text-primary" />,
          content: (
            <p>
              The creators and operators of this platform are not registered financial advisors, brokers, or dealers. If you require professional financial assistance, you should consult with a certified financial planner or registered investment advisor.
            </p>
          ),
        },
      ],
    },
    de: {
      title: 'Haftungsausschluss (Disclaimer)',
      subtitle: 'Zuletzt aktualisiert: 23. März 2026',
      sections: [
        {
          id: 1,
          title: '1. Keine Anlageberatung',
          icon: <AlertTriangle className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Die auf Marc's Trading Journal bereitgestellten Informationen, Analysen und Tools stellen keine Finanz-, Anlage-, Handels- oder sonstige professionelle Beratung dar. Alle Inhalte dienen ausschließlich Informations- und Bildungszwecken. Sie sollten keine finanziellen Entscheidungen ausschließlich auf Grundlage der von dieser Plattform bereitgestellten Informationen treffen.
            </p>
          ),
        },
        {
          id: 2,
          title: '2. Reiner Tool- und Analysecharakter',
          icon: <Wrench className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Diese Plattform ist streng als Software-Tool konzipiert, das Benutzern hilft, ihre eigenen Handelsaktivitäten zu protokollieren, zu verfolgen und zu analysieren. Alle Metriken, Diagramme oder KI-generierten Erkenntnisse werden aus den von Ihnen eingegebenen Daten abgeleitet und sollen bei der Selbstreflexion und Strategiebewertung helfen, nicht jedoch zukünftige Marktbewegungen vorhersagen.
            </p>
          ),
        },
        {
          id: 3,
          title: '3. Keine Gewähr für Richtigkeit und Vollständigkeit',
          icon: <ShieldQuestion className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Obwohl wir uns bemühen, die korrekte Funktion der Plattform sicherzustellen, übernehmen wir keine Gewähr oder Zusicherung hinsichtlich der Richtigkeit, Vollständigkeit, Zuverlässigkeit oder Aktualität von Berechnungen, Datenexporten oder Analyseergebnissen. Softwarefehler oder Datenverarbeitungsfehler können auftreten.
            </p>
          ),
        },
        {
          id: 4,
          title: '4. Eigenverantwortung der Nutzer',
          icon: <UserCheck className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Sie sind allein verantwortlich für Ihre eigenen Handelsentscheidungen und deren Konsequenzen. Durch die Nutzung dieser Plattform erkennen Sie an, dass der Handel an den Finanzmärkten mit einem hohen Risiko verbunden ist und Sie einen Teil oder Ihr gesamtes investiertes Kapital verlieren können.
            </p>
          ),
        },
        {
          id: 5,
          title: '5. Keine Erfolgsgarantie',
          icon: <TrendingDown className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Die in der Vergangenheit erzielte Performance, ob simuliert, verfolgt oder auf dieser Plattform analysiert, ist kein Indikator für zukünftige Ergebnisse. Die Nutzung eines Trading-Journals oder von Analysetools garantiert weder Rentabilität noch Erfolg beim Handel.
            </p>
          ),
        },
        {
          id: 6,
          title: '6. Haftungsbeschränkung',
          icon: <Scale className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Soweit nach geltendem Recht zulässig, haften Marc Reinhardt und die Betreiber dieser Plattform nicht für direkte, indirekte, zufällige, Folge- oder Strafschäden, einschließlich, aber nicht beschränkt auf finanzielle Verluste, die sich aus Ihrer Nutzung oder der Unmöglichkeit der Nutzung der Plattform ergeben.
            </p>
          ),
        },
        {
          id: 7,
          title: '7. Verfügbarkeit der Plattform',
          icon: <Activity className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Wir garantieren nicht, dass die Plattform jederzeit ohne Unterbrechung verfügbar ist. Der Zugang kann bei Systemausfällen, Wartungsarbeiten, Reparaturen oder aus Gründen, die außerhalb unserer Kontrolle liegen, vorübergehend und ohne vorherige Ankündigung ausgesetzt werden.
            </p>
          ),
        },
        {
          id: 8,
          title: '8. Keine professionelle Beratung',
          icon: <Briefcase className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Die Ersteller und Betreiber dieser Plattform sind keine registrierten Finanzberater, Broker oder Händler. Wenn Sie professionelle finanzielle Unterstützung benötigen, sollten Sie einen zertifizierten Finanzplaner oder einen registrierten Anlageberater konsultieren.
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
        <meta name="description" content="Legal Disclaimer and Limitation of Liability" />
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
                ? 'By using this platform, you acknowledge that you have read, understood, and agree to this disclaimer.'
                : 'Durch die Nutzung dieser Plattform erkennen Sie an, dass Sie diesen Haftungsausschluss gelesen und verstanden haben und ihm zustimmen.'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default DisclaimerPage;
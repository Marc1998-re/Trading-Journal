import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Mail, 
  Globe, 
  FileText, 
  AlertCircle, 
  Copyright, 
  Code, 
  Shield 
} from 'lucide-react';

const ImpressumPage = () => {
  const [lang, setLang] = useState('en');

  const content = {
    en: {
      title: 'Legal Notice',
      subtitle: 'Impressum - Last updated: March 23, 2026',
      sections: [
        {
          id: 1,
          title: 'Responsible Party',
          icon: <Building2 className="w-5 h-5 text-primary" />,
          content: (
            <div className="space-y-3">
              <p className="font-semibold text-foreground">Marc Reinhardt</p>
              <p className="text-muted-foreground">
                Individual trader and operator of Marc's Trading Journal
              </p>
            </div>
          ),
        },
        {
          id: 2,
          title: 'Contact Information',
          icon: <Mail className="w-5 h-5 text-primary" />,
          content: (
            <div className="space-y-3">
              <div>
                <p className="font-medium text-foreground mb-1">Address:</p>
                <p className="text-muted-foreground">
                  Müllerweg 8B<br />
                  63165 Mühlheim<br />
                  Germany
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Email:</p>
                <p>
                  <a href="mailto:Marc.re1998@gmail.com" className="text-primary hover:underline">
                    Marc.re1998@gmail.com
                  </a>
                </p>
              </div>
            </div>
          ),
        },
        {
          id: 3,
          title: 'Website Information',
          icon: <Globe className="w-5 h-5 text-primary" />,
          content: (
            <div className="space-y-2">
              <p>
                <span className="font-medium text-foreground">Platform:</span> Marc's Trading Journal
              </p>
              <p>
                <span className="font-medium text-foreground">Hosting Provider:</span> Hostinger International Ltd.
              </p>
              <p className="text-sm text-muted-foreground">
                Servers located in Germany/EU
              </p>
            </div>
          ),
        },
        {
          id: 4,
          title: 'Liability Disclaimer',
          icon: <AlertCircle className="w-5 h-5 text-primary" />,
          content: (
            <div className="space-y-3">
              <p>
                The content of this website is provided for informational purposes only. While we strive to ensure accuracy, we make no warranties or representations regarding the completeness, accuracy, or reliability of the information provided.
              </p>
              <p>
                Marc's Trading Journal is not responsible for any direct, indirect, incidental, special, or consequential damages arising from the use of or inability to use the platform or its content.
              </p>
            </div>
          ),
        },
        {
          id: 5,
          title: 'No Investment Advice',
          icon: <Shield className="w-5 h-5 text-primary" />,
          content: (
            <p>
              The platform and all its features, including analytics and AI-generated insights, do not constitute financial, investment, or trading advice. Users are solely responsible for their own trading decisions and any resulting financial outcomes.
            </p>
          ),
        },
        {
          id: 6,
          title: 'Copyright and Intellectual Property',
          icon: <Copyright className="w-5 h-5 text-primary" />,
          content: (
            <p>
              All content, design, graphics, and software code of Marc's Trading Journal are protected by copyright and other intellectual property laws. Unauthorized reproduction, distribution, or modification of any content is strictly prohibited.
            </p>
          ),
        },
        {
          id: 7,
          title: 'Technical Information',
          icon: <Code className="w-5 h-5 text-primary" />,
          content: (
            <div className="space-y-2">
              <p>
                <span className="font-medium text-foreground">Technology Stack:</span>
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Frontend: React 18.3.1, Vite, TailwindCSS</li>
                <li>Backend: PocketBase</li>
                <li>Hosting: Hostinger</li>
              </ul>
            </div>
          ),
        },
        {
          id: 8,
          title: 'Data Protection',
          icon: <FileText className="w-5 h-5 text-primary" />,
          content: (
            <p>
              For detailed information about how we collect, process, and protect your personal data, please refer to our <a href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</a>.
            </p>
          ),
        },
      ],
    },
    de: {
      title: 'Impressum',
      subtitle: 'Zuletzt aktualisiert: 23. März 2026',
      sections: [
        {
          id: 1,
          title: 'Verantwortlicher',
          icon: <Building2 className="w-5 h-5 text-primary" />,
          content: (
            <div className="space-y-3">
              <p className="font-semibold text-foreground">Marc Reinhardt</p>
              <p className="text-muted-foreground">
                Einzelner Trader und Betreiber von Marc's Trading Journal
              </p>
            </div>
          ),
        },
        {
          id: 2,
          title: 'Kontaktinformationen',
          icon: <Mail className="w-5 h-5 text-primary" />,
          content: (
            <div className="space-y-3">
              <div>
                <p className="font-medium text-foreground mb-1">Adresse:</p>
                <p className="text-muted-foreground">
                  Müllerweg 8B<br />
                  63165 Mühlheim<br />
                  Deutschland
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">E-Mail:</p>
                <p>
                  <a href="mailto:Marc.re1998@gmail.com" className="text-primary hover:underline">
                    Marc.re1998@gmail.com
                  </a>
                </p>
              </div>
            </div>
          ),
        },
        {
          id: 3,
          title: 'Website-Informationen',
          icon: <Globe className="w-5 h-5 text-primary" />,
          content: (
            <div className="space-y-2">
              <p>
                <span className="font-medium text-foreground">Plattform:</span> Marc's Trading Journal
              </p>
              <p>
                <span className="font-medium text-foreground">Hosting-Anbieter:</span> Hostinger International Ltd.
              </p>
              <p className="text-sm text-muted-foreground">
                Server in Deutschland/EU
              </p>
            </div>
          ),
        },
        {
          id: 4,
          title: 'Haftungsausschluss',
          icon: <AlertCircle className="w-5 h-5 text-primary" />,
          content: (
            <div className="space-y-3">
              <p>
                Der Inhalt dieser Website wird nur zu Informationszwecken bereitgestellt. Obwohl wir uns bemühen, die Genauigkeit zu gewährleisten, geben wir keine Garantien oder Zusicherungen bezüglich der Vollständigkeit, Genauigkeit oder Zuverlässigkeit der bereitgestellten Informationen.
              </p>
              <p>
                Marc's Trading Journal ist nicht verantwortlich für direkte, indirekte, zufällige, besondere oder Folgeschäden, die sich aus der Nutzung oder der Unmöglichkeit der Nutzung der Plattform oder ihres Inhalts ergeben.
              </p>
            </div>
          ),
        },
        {
          id: 5,
          title: 'Keine Anlageberatung',
          icon: <Shield className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Die Plattform und alle ihre Funktionen, einschließlich Analysen und KI-generierter Erkenntnisse, stellen keine Finanz-, Anlage- oder Handelsberatung dar. Nutzer sind allein verantwortlich für ihre eigenen Handelsentscheidungen und die daraus resultierenden finanziellen Ergebnisse.
            </p>
          ),
        },
        {
          id: 6,
          title: 'Urheberrecht und geistiges Eigentum',
          icon: <Copyright className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Alle Inhalte, Designs, Grafiken und Softwarecodes von Marc's Trading Journal sind durch Urheberrecht und andere Gesetze zum Schutz geistigen Eigentums geschützt. Die unbefugte Vervielfältigung, Verbreitung oder Änderung von Inhalten ist strengstens untersagt.
            </p>
          ),
        },
        {
          id: 7,
          title: 'Technische Informationen',
          icon: <Code className="w-5 h-5 text-primary" />,
          content: (
            <div className="space-y-2">
              <p>
                <span className="font-medium text-foreground">Technologie-Stack:</span>
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Frontend: React 18.3.1, Vite, TailwindCSS</li>
                <li>Backend: PocketBase</li>
                <li>Hosting: Hostinger</li>
              </ul>
            </div>
          ),
        },
        {
          id: 8,
          title: 'Datenschutz',
          icon: <FileText className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Detaillierte Informationen darüber, wie wir Ihre persönlichen Daten erfassen, verarbeiten und schützen, finden Sie in unserer <a href="/privacy" className="text-primary hover:underline font-medium">Datenschutzerklärung</a>.
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
        <meta name="description" content="Legal Notice and Impressum Information" />
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
                ? 'If you have any questions about this Legal Notice, please contact us.'
                : 'Wenn Sie Fragen zu diesem Impressum haben, kontaktieren Sie uns bitte.'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ImpressumPage;
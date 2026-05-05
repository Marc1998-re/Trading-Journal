import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Shield, Mail, Database, Lock, FileText } from 'lucide-react';

const PrivacyPolicyPage = () => {
  const [lang, setLang] = useState('en');

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'de' : 'en'));
  };

  const content = {
    en: {
      title: 'Privacy Policy',
      subtitle: 'Last updated: March 23, 2026',
      sections: [
        {
          id: 1,
          title: '1. General Information',
          icon: <FileText className="w-5 h-5 text-primary" />,
          content: (
            <p>
              This Privacy Policy explains how we collect, use, and protect your personal data when you use our trading journal application. We are committed to ensuring that your privacy is protected and that your data is handled in accordance with applicable data protection laws.
            </p>
          ),
        },
        {
          id: 2,
          title: '2. Responsible Party',
          icon: <Shield className="w-5 h-5 text-primary" />,
          content: (
            <p>
              The responsible party for data processing on this website is:<br />
              <strong>Marc Reinhardt</strong><br />
              Email: <a href="mailto:marc.re1998@gmail.com" className="text-primary hover:underline">marc.re1998@gmail.com</a>
            </p>
          ),
        },
        {
          id: 3,
          title: '3. Collection and Processing of Personal Data',
          icon: <Database className="w-5 h-5 text-primary" />,
          content: (
            <>
              <p className="mb-2">We collect the following personal data:</p>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                <li><strong>Email Address:</strong> Used for account creation, authentication, and communication regarding your account.</li>
                <li><strong>Password:</strong> Required for secure account access.</li>
              </ul>
              <p>
                <strong>Purpose:</strong> This data is strictly used for account creation, secure account access, and the assignment of your personal trading data to your specific user profile.
              </p>
            </>
          ),
        },
        {
          id: 4,
          title: '4. No Use of Tracking Tools',
          icon: <Shield className="w-5 h-5 text-primary" />,
          content: (
            <p>
              We respect your privacy. This application does <strong>not</strong> use any third-party tracking tools, analytics scripts (such as Google Analytics), or advertising trackers. Your activity within the app remains private.
            </p>
          ),
        },
        {
          id: 5,
          title: '5. No Data Sharing with Third Parties',
          icon: <Lock className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Your personal data and trading history are strictly confidential. We do not sell, trade, or otherwise transfer your personally identifiable information or trading data to outside parties under any circumstances.
            </p>
          ),
        },
        {
          id: 6,
          title: '6. Data Storage',
          icon: <Database className="w-5 h-5 text-primary" />,
          content: (
            <div className="space-y-3">
              <p>
                <Badge variant="outline" className="mr-2 mb-1">Server Location</Badge>
                Your data is securely hosted on <strong>Hostinger servers located in Germany/EU</strong>, ensuring compliance with strict European data protection standards.
              </p>
              <p>
                <Badge variant="outline" className="mr-2 mb-1">Storage Duration</Badge>
                Your data is stored as long as your account remains active. If you choose to delete your account, all personal data and associated trading data will be <strong>permanently deleted within 30 days</strong>.
              </p>
              <p>
                <Badge variant="outline" className="mr-2 mb-1">Password Security</Badge>
                Passwords are never stored in plain text. We use industry-standard encryption (<strong>bcrypt</strong>) to hash all passwords.
              </p>
              <p>
                <Badge variant="outline" className="mr-2 mb-1">Backups</Badge>
                Regular backups are maintained solely for data integrity and disaster recovery purposes.
              </p>
            </div>
          ),
        },
        {
          id: 7,
          title: '7. Data Export',
          icon: <FileText className="w-5 h-5 text-primary" />,
          content: (
            <p>
              You have full control over your trading data. Users can export their complete trading history as a CSV file at any time. This export functionality is securely restricted and can only be accessed by the authenticated user themselves.
            </p>
          ),
        },
        {
          id: 8,
          title: '8. International Use',
          icon: <Globe className="w-5 h-5 text-primary" />,
          content: (
            <p>
              While our servers are located in the EU, our application serves global users. We adhere to the strict guidelines of the <strong>General Data Protection Regulation (GDPR / DSGVO)</strong> for European users, while also respecting US data protection laws and international privacy standards.
            </p>
          ),
        },
        {
          id: 9,
          title: '9. User Rights',
          icon: <Shield className="w-5 h-5 text-primary" />,
          content: (
            <>
              <p className="mb-2">Under applicable data protection laws, you have the following rights regarding your personal data:</p>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                <li><strong>Right to Information:</strong> You can request details about the data we hold about you.</li>
                <li><strong>Right to Correction:</strong> You can request corrections to inaccurate or incomplete data.</li>
                <li><strong>Right to Deletion:</strong> You can request the deletion of your account and associated data.</li>
                <li><strong>Right to Restrict Processing:</strong> You can request limitations on how we process your data.</li>
                <li><strong>Right to Data Portability:</strong> You can export your data in a structured, commonly used format (CSV).</li>
              </ul>
              <p>
                To exercise any of these rights, please contact: <a href="mailto:marc.re1998@gmail.com" className="text-primary hover:underline font-medium">marc.re1998@gmail.com</a>
              </p>
            </>
          ),
        },
        {
          id: 10,
          title: '10. Data Security',
          icon: <Lock className="w-5 h-5 text-primary" />,
          content: (
            <p>
              We implement a variety of security measures to maintain the safety of your personal information. All data transfers between your browser and our servers are encrypted using modern SSL/TLS protocols. Access to the database is strictly restricted and monitored.
            </p>
          ),
        },
        {
          id: 11,
          title: '11. Legal Basis',
          icon: <FileText className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Data processing is based on <strong>Art. 6 Para. 1 lit. a GDPR</strong> (User Consent) and <strong>Art. 6 Para. 1 lit. b GDPR</strong> (Contract Performance). By creating an account, you consent to the processing of your data for the purpose of account management and providing the trading journal services you requested.
            </p>
          ),
        },
        {
          id: 12,
          title: '12. Changes to this Privacy Policy',
          icon: <FileText className="w-5 h-5 text-primary" />,
          content: (
            <p>
              We reserve the right to update or modify this Privacy Policy at any time. Any changes will be reflected on this page with an updated revision date. We encourage users to frequently check this page for any changes to stay informed about how we are protecting the personal information we collect.
            </p>
          ),
        },
      ],
    },
    de: {
      title: 'Datenschutzerklärung',
      subtitle: 'Zuletzt aktualisiert: 23. März 2026',
      sections: [
        {
          id: 1,
          title: '1. Allgemeine Hinweise',
          icon: <FileText className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Diese Datenschutzerklärung klärt Sie über die Art, den Umfang und Zweck der Verarbeitung von personenbezogenen Daten innerhalb unserer Trading-Journal-Anwendung auf. Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst und behandeln diese vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften.
            </p>
          ),
        },
        {
          id: 2,
          title: '2. Verantwortlicher',
          icon: <Shield className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Der Verantwortliche für die Datenverarbeitung auf dieser Website ist:<br />
              <strong>Marc Reinhardt</strong><br />
              E-Mail: <a href="mailto:marc.re1998@gmail.com" className="text-primary hover:underline">marc.re1998@gmail.com</a>
            </p>
          ),
        },
        {
          id: 3,
          title: '3. Erhebung und Verarbeitung personenbezogener Daten',
          icon: <Database className="w-5 h-5 text-primary" />,
          content: (
            <>
              <p className="mb-2">Wir erheben folgende personenbezogene Daten:</p>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                <li><strong>E-Mail-Adresse:</strong> Wird für die Kontoerstellung, Authentifizierung und kontobezogene Kommunikation verwendet.</li>
                <li><strong>Passwort:</strong> Erforderlich für den sicheren Kontozugang.</li>
              </ul>
              <p>
                <strong>Zweck:</strong> Diese Daten werden ausschließlich für die Kontoerstellung, den sicheren Zugang und die Zuordnung Ihrer persönlichen Trading-Daten zu Ihrem spezifischen Benutzerprofil verwendet.
              </p>
            </>
          ),
        },
        {
          id: 4,
          title: '4. Keine Nutzung von Tracking-Tools',
          icon: <Shield className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Wir respektieren Ihre Privatsphäre. Diese Anwendung verwendet <strong>keine</strong> Tracking-Tools von Drittanbietern, Analyse-Skripte (wie Google Analytics) oder Werbe-Tracker. Ihre Aktivitäten innerhalb der App bleiben privat.
            </p>
          ),
        },
        {
          id: 5,
          title: '5. Keine Weitergabe an Dritte',
          icon: <Lock className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Ihre persönlichen Daten und Ihre Trading-Historie sind streng vertraulich. Wir verkaufen, tauschen oder übertragen Ihre personenbezogenen Daten oder Trading-Daten unter keinen Umständen an externe Dritte.
            </p>
          ),
        },
        {
          id: 6,
          title: '6. Datenspeicherung',
          icon: <Database className="w-5 h-5 text-primary" />,
          content: (
            <div className="space-y-3">
              <p>
                <Badge variant="outline" className="mr-2 mb-1">Serverstandort</Badge>
                Ihre Daten werden sicher auf <strong>Hostinger-Servern in Deutschland/EU</strong> gehostet, was die Einhaltung strenger europäischer Datenschutzstandards gewährleistet.
              </p>
              <p>
                <Badge variant="outline" className="mr-2 mb-1">Speicherdauer</Badge>
                Ihre Daten werden so lange gespeichert, wie Ihr Konto aktiv ist. Wenn Sie Ihr Konto löschen, werden alle personenbezogenen Daten und die damit verbundenen Trading-Daten <strong>innerhalb von 30 Tagen dauerhaft gelöscht</strong>.
              </p>
              <p>
                <Badge variant="outline" className="mr-2 mb-1">Passwortsicherheit</Badge>
                Passwörter werden niemals im Klartext gespeichert. Wir verwenden branchenübliche Verschlüsselung (<strong>bcrypt</strong>), um alle Passwörter zu hashen.
              </p>
              <p>
                <Badge variant="outline" className="mr-2 mb-1">Backups</Badge>
                Regelmäßige Backups werden ausschließlich zur Gewährleistung der Datenintegrität und zur Notfallwiederherstellung (Disaster Recovery) durchgeführt.
              </p>
            </div>
          ),
        },
        {
          id: 7,
          title: '7. Datenexport',
          icon: <FileText className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Sie haben die volle Kontrolle über Ihre Trading-Daten. Benutzer können ihre komplette Trading-Historie jederzeit als CSV-Datei exportieren. Diese Exportfunktion ist sicherheitsbeschränkt und kann nur vom authentifizierten Benutzer selbst aufgerufen werden.
            </p>
          ),
        },
        {
          id: 8,
          title: '8. Internationale Nutzung',
          icon: <Globe className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Obwohl sich unsere Server in der EU befinden, bedient unsere Anwendung globale Nutzer. Wir halten uns an die strengen Richtlinien der <strong>Datenschutz-Grundverordnung (DSGVO)</strong> für europäische Nutzer und respektieren gleichzeitig US-Datenschutzgesetze sowie internationale Datenschutzstandards.
            </p>
          ),
        },
        {
          id: 9,
          title: '9. Rechte der Nutzer',
          icon: <Shield className="w-5 h-5 text-primary" />,
          content: (
            <>
              <p className="mb-2">Nach geltendem Datenschutzrecht haben Sie folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                <li><strong>Recht auf Auskunft:</strong> Sie können Details über die Daten anfordern, die wir über Sie gespeichert haben.</li>
                <li><strong>Recht auf Berichtigung:</strong> Sie können die Korrektur ungenauer oder unvollständiger Daten verlangen.</li>
                <li><strong>Recht auf Löschung:</strong> Sie können die Löschung Ihres Kontos und der damit verbundenen Daten verlangen.</li>
                <li><strong>Recht auf Einschränkung der Verarbeitung:</strong> Sie können Einschränkungen bei der Verarbeitung Ihrer Daten verlangen.</li>
                <li><strong>Recht auf Datenübertragbarkeit:</strong> Sie können Ihre Daten in einem strukturierten, gängigen Format (CSV) exportieren.</li>
              </ul>
              <p>
                Um eines dieser Rechte auszuüben, kontaktieren Sie bitte: <a href="mailto:marc.re1998@gmail.com" className="text-primary hover:underline font-medium">marc.re1998@gmail.com</a>
              </p>
            </>
          ),
        },
        {
          id: 10,
          title: '10. Datensicherheit',
          icon: <Lock className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Wir setzen verschiedene Sicherheitsmaßnahmen ein, um die Sicherheit Ihrer persönlichen Daten zu gewährleisten. Alle Datenübertragungen zwischen Ihrem Browser und unseren Servern werden mit modernen SSL/TLS-Protokollen verschlüsselt. Der Zugriff auf die Datenbank ist streng beschränkt und wird überwacht.
            </p>
          ),
        },
        {
          id: 11,
          title: '11. Rechtsgrundlage',
          icon: <FileText className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Die Datenverarbeitung erfolgt auf Grundlage von <strong>Art. 6 Abs. 1 lit. a DSGVO</strong> (Einwilligung des Nutzers) und <strong>Art. 6 Abs. 1 lit. b DSGVO</strong> (Vertragserfüllung). Mit der Erstellung eines Kontos willigen Sie in die Verarbeitung Ihrer Daten zum Zwecke der Kontoverwaltung und der Bereitstellung der von Ihnen angeforderten Trading-Journal-Dienste ein.
            </p>
          ),
        },
        {
          id: 12,
          title: '12. Änderungen dieser Datenschutzerklärung',
          icon: <FileText className="w-5 h-5 text-primary" />,
          content: (
            <p>
              Wir behalten uns das Recht vor, diese Datenschutzerklärung jederzeit zu aktualisieren oder zu ändern. Alle Änderungen werden auf dieser Seite mit einem aktualisierten Revisionsdatum veröffentlicht. Wir empfehlen den Nutzern, diese Seite regelmäßig auf Änderungen zu überprüfen, um darüber informiert zu bleiben, wie wir die von uns erfassten persönlichen Daten schützen.
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
        <meta name="description" content="Privacy Policy and Data Protection Information" />
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
                ? 'If you have any questions about this Privacy Policy, please contact us.'
                : 'Wenn Sie Fragen zu dieser Datenschutzerklärung haben, kontaktieren Sie uns bitte.'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicyPage;
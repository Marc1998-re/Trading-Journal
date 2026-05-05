import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const SettingsSection = ({ title, description, children }) => {
  return (
    <Card className="rounded-2xl shadow-sm border-border/50 overflow-hidden transition-all duration-200">
      <CardHeader className="bg-muted/10 border-b border-border/30 pb-6">
        <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
        {description && (
          <CardDescription className="text-base mt-2">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        {children}
      </CardContent>
    </Card>
  );
};

export default SettingsSection;
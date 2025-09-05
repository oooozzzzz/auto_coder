'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({ children, className = '' }) => {
  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6", className)}>
      {children}
    </div>
  );
};

interface GridColumnProps {
  children: React.ReactNode;
  span?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  className?: string;
}

export const GridColumn: React.FC<GridColumnProps> = ({ 
  children, 
  span = { lg: 12 }, 
  className = '' 
}) => {
  const getSpanClasses = () => {
    const classes = [];
    if (span.sm) classes.push(`sm:col-span-${span.sm}`);
    if (span.md) classes.push(`md:col-span-${span.md}`);
    if (span.lg) classes.push(`lg:col-span-${span.lg}`);
    if (span.xl) classes.push(`xl:col-span-${span.xl}`);
    return classes.join(' ');
  };

  return (
    <div className={cn("col-span-1", getSpanClasses(), className)}>
      {children}
    </div>
  );
};

interface ResponsiveCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({ 
  children, 
  title, 
  subtitle, 
  actions,
  className = ''
}) => {
  return (
    <Card className={cn("flex flex-col h-full", className)}>
      {(title || subtitle || actions) && (
        <CardHeader className="pb-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-2 sm:mb-0">
              {title && <CardTitle className="text-lg">{title}</CardTitle>}
              {subtitle && <CardDescription className="mt-1">{subtitle}</CardDescription>}
            </div>
            {actions && (
              <div className="flex-shrink-0">
                {actions}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn("flex-1 flex flex-col", title || subtitle || actions ? "pt-0" : "")}>
        {children}
      </CardContent>
    </Card>
  );
};

interface ResponsiveStackProps {
  children: React.ReactNode;
  direction?: 'vertical' | 'horizontal' | 'responsive';
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({ 
  children, 
  direction = 'vertical',
  spacing = 'md',
  className = ''
}) => {
  const spacingClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  const directionClasses = {
    vertical: 'flex flex-col',
    horizontal: 'flex flex-row',
    responsive: 'flex flex-col sm:flex-row'
  };

  return (
    <div className={cn(directionClasses[direction], spacingClasses[spacing], className)}>
      {children}
    </div>
  );
};
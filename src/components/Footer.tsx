'use client';

import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Left side - Info */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
            <div className="text-sm text-gray-600">
              © {currentYear} Excel to Word Generator
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Версия 1.0.0</span>
              <span>•</span>
              <span>Создано с ❤️ для удобства работы</span>
            </div>
          </div>

          {/* Right side - Links and info */}
          <div className="flex items-center space-x-6">
            {/* Browser compatibility info */}
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Поддерживаются современные браузеры</span>
            </div>

            {/* Features info */}
            <div className="hidden md:flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>IndexedDB</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Web Workers</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Drag & Drop</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional info row */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
            <div className="text-xs text-gray-500">
              Поддерживаемые форматы: Excel (.xlsx, .xls) → Word (.docx)
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Все данные обрабатываются локально</span>
              <span>•</span>
              <span>Конфиденциальность гарантирована</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
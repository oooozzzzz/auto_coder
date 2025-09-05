import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DataPreview from '../DataPreview';
import { ExcelData } from '@/types';

describe('DataPreview', () => {
    const mockData: ExcelData = {
        headers: ['Name', 'Age', 'City', 'Email'],
        rows: [
            { Name: 'John Doe', Age: 30, City: 'New York', Email: 'john@example.com' },
            { Name: 'Jane Smith', Age: 25, City: 'London', Email: 'jane@example.com' },
            { Name: 'Bob Johnson', Age: 35, City: 'Paris', Email: 'bob@example.com' },
            { Name: 'Alice Brown', Age: 28, City: 'Tokyo', Email: 'alice@example.com' },
            { Name: 'Charlie Wilson', Age: 32, City: 'Sydney', Email: 'charlie@example.com' }
        ],
        sheetNames: ['Sheet1'],
        selectedSheet: 'Sheet1'
    };

    const multiSheetData: ExcelData = {
        ...mockData,
        sheetNames: ['Sheet1', 'Sheet2', 'Sheet3'],
        selectedSheet: 'Sheet1'
    };

    it('renders loading state', () => {
        render(<DataPreview data={null} isLoading={true} />);

        expect(screen.getByText('Загрузка данных...')).toBeInTheDocument();
    });

    it('renders empty state when no data', () => {
        render(<DataPreview data={null} isLoading={false} />);

        expect(screen.getByText('Нет данных для отображения')).toBeInTheDocument();
        expect(screen.getByText('Загрузите Excel файл для просмотра данных')).toBeInTheDocument();
    });

    it('renders data table with headers and rows', () => {
        render(<DataPreview data={mockData} isLoading={false} />);

        // Check headers
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Age')).toBeInTheDocument();
        expect(screen.getByText('City')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();

        // Check data rows
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('New York')).toBeInTheDocument();
        expect(screen.getByText('London')).toBeInTheDocument();
    });

    it('displays statistics correctly', () => {
        render(<DataPreview data={mockData} isLoading={false} />);

        expect(screen.getByText('5 строк')).toBeInTheDocument();
        expect(screen.getByText('4 столбцов')).toBeInTheDocument();
    });

    it('shows sheet selector for multi-sheet data', () => {
        const mockOnSheetChange = vi.fn();

        render(
            <DataPreview
                data={multiSheetData}
                isLoading={false}
                onSheetChange={mockOnSheetChange}
            />
        );

        expect(screen.getByText('Лист:')).toBeInTheDocument();

        const select = screen.getByDisplayValue('Sheet1');
        expect(select).toBeInTheDocument();

        // Test sheet change
        fireEvent.change(select, { target: { value: 'Sheet2' } });
        expect(mockOnSheetChange).toHaveBeenCalledWith('Sheet2');
    });

    it('handles pagination correctly', () => {
        // Create data with more rows to test pagination
        const largeData: ExcelData = {
            ...mockData,
            rows: Array.from({ length: 100 }, (_, i) => ({
                Name: `User ${i + 1}`,
                Age: 20 + (i % 50),
                City: `City ${i + 1}`,
                Email: `user${i + 1}@example.com`
            }))
        };

        render(<DataPreview data={largeData} isLoading={false} />);

        // Should show pagination controls
        expect(screen.getByText('Страница 1 из 2')).toBeInTheDocument();

        // Test navigation
        const nextButton = screen.getByText('»');
        fireEvent.click(nextButton);

        expect(screen.getByText('Страница 2 из 2')).toBeInTheDocument();
    });

    it('handles rows per page change', () => {
        render(<DataPreview data={mockData} isLoading={false} />);

        const rowsPerPageSelect = screen.getByDisplayValue('50');
        fireEvent.change(rowsPerPageSelect, { target: { value: '25' } });

        expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    });

    it('shows warning for large datasets', () => {
        const largeData: ExcelData = {
            ...mockData,
            rows: Array.from({ length: 200 }, (_, i) => ({
                Name: `User ${i + 1}`,
                Age: 20 + (i % 50),
                City: `City ${i + 1}`,
                Email: `user${i + 1}@example.com`
            }))
        };

        render(<DataPreview data={largeData} isLoading={false} maxRows={100} />);

        expect(screen.getByText(/Отображаются только первые 100 строк из 200/)).toBeInTheDocument();
    });

    it('handles empty cells correctly', () => {
        const dataWithEmptyCells: ExcelData = {
            headers: ['Name', 'Age', 'City'],
            rows: [
                { Name: 'John', Age: null, City: 'New York' },
                { Name: '', Age: 25, City: undefined },
                { Name: 'Bob', Age: 30, City: '' }
            ],
            sheetNames: ['Sheet1'],
            selectedSheet: 'Sheet1'
        };

        render(<DataPreview data={dataWithEmptyCells} isLoading={false} />);

        // Should show "пусто" for empty cells
        const emptyCells = screen.getAllByText('пусто');
        expect(emptyCells.length).toBeGreaterThan(0);
    });

    it('shows row numbers correctly', () => {
        render(<DataPreview data={mockData} isLoading={false} />);

        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('handles hover effects on table rows', () => {
        render(<DataPreview data={mockData} isLoading={false} />);

        const firstRow = screen.getByText('John Doe').closest('tr');
        expect(firstRow).toHaveClass('hover:bg-gray-50');
    });

    it('truncates long cell content with title attribute', () => {
        const dataWithLongContent: ExcelData = {
            headers: ['Name', 'Description'],
            rows: [
                {
                    Name: 'John',
                    Description: 'This is a very long description that should be truncated in the table cell but shown in full in the title attribute'
                }
            ],
            sheetNames: ['Sheet1'],
            selectedSheet: 'Sheet1'
        };

        render(<DataPreview data={dataWithLongContent} isLoading={false} />);

        const cellWithLongContent = screen.getByText(/This is a very long description/);
        expect(cellWithLongContent.closest('div')).toHaveClass('truncate');
    });
});
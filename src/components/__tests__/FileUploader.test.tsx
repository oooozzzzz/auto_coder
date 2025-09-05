import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileUploader from '../FileUploader';
import { ExcelData } from '@/types';

// Mock ExcelService
vi.mock('@/services/ExcelService', () => ({
  ExcelService: vi.fn(() => ({
    parseFile: vi.fn(),
    getSheetData: vi.fn()
  }))
}));

// Mock validators
vi.mock('@/utils/validators', () => ({
  validateFileSize: vi.fn(() => ({ isValid: true })),
  validateFileType: vi.fn(() => ({ isValid: true }))
}));

// Mock formatters
vi.mock('@/utils/formatters', () => ({
  formatFileSize: vi.fn((size) => `${Math.round(size / 1024)}KB`)
}));

describe('FileUploader', () => {
  const mockOnFileUpload = vi.fn();
  const mockOnError = vi.fn();

  const mockExcelData: ExcelData = {
    headers: ['Name', 'Age', 'City'],
    rows: [
      { Name: 'John', Age: 30, City: 'New York' },
      { Name: 'Jane', Age: 25, City: 'London' }
    ],
    sheetNames: ['Sheet1'],
    selectedSheet: 'Sheet1'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload area correctly', () => {
    render(
      <FileUploader 
        onFileUpload={mockOnFileUpload}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Загрузите Excel файл')).toBeInTheDocument();
    expect(screen.getByText('Перетащите файл сюда или нажмите для выбора')).toBeInTheDocument();
    expect(screen.getByText('Поддерживаемые форматы: .xlsx, .xls, .csv')).toBeInTheDocument();
  });

  it('shows loading state when processing file', () => {
    render(
      <FileUploader 
        onFileUpload={mockOnFileUpload}
        onError={mockOnError}
        isLoading={true}
      />
    );

    expect(screen.getByText('Обработка файла...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
  });

  it('handles file selection via input', async () => {
    const { ExcelService } = await import('@/services/ExcelService');
    const mockParseFile = vi.fn().mockResolvedValue(mockExcelData);
    (ExcelService as any).mockImplementation(() => ({
      parseFile: mockParseFile
    }));

    render(
      <FileUploader 
        onFileUpload={mockOnFileUpload}
        onError={mockOnError}
      />
    );

    const file = new File(['test content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const input = screen.getByRole('button', { hidden: true });
    const fileInput = input.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(mockOnFileUpload).toHaveBeenCalledWith(mockExcelData);
    });
  });

  it('handles drag and drop', async () => {
    const { ExcelService } = await import('@/services/ExcelService');
    const mockParseFile = vi.fn().mockResolvedValue(mockExcelData);
    (ExcelService as any).mockImplementation(() => ({
      parseFile: mockParseFile
    }));

    render(
      <FileUploader 
        onFileUpload={mockOnFileUpload}
        onError={mockOnError}
      />
    );

    const dropZone = screen.getByText('Загрузите Excel файл').closest('div');
    const file = new File(['test content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    // Simulate drag enter
    fireEvent.dragEnter(dropZone!, {
      dataTransfer: { files: [file] }
    });

    expect(screen.getByText('Отпустите файл здесь')).toBeInTheDocument();

    // Simulate drop
    fireEvent.drop(dropZone!, {
      dataTransfer: { files: [file] }
    });

    await waitFor(() => {
      expect(mockOnFileUpload).toHaveBeenCalledWith(mockExcelData);
    });
  });

  it('shows sheet selector for multi-sheet files', async () => {
    const multiSheetData: ExcelData = {
      ...mockExcelData,
      sheetNames: ['Sheet1', 'Sheet2', 'Sheet3']
    };

    const { ExcelService } = await import('@/services/ExcelService');
    const mockParseFile = vi.fn().mockResolvedValue(multiSheetData);
    const mockGetSheetData = vi.fn()
      .mockResolvedValueOnce({
        name: 'Sheet1',
        rowCount: 10,
        columnCount: 3,
        hasHeaders: true
      })
      .mockResolvedValueOnce({
        name: 'Sheet2',
        rowCount: 5,
        columnCount: 2,
        hasHeaders: false
      })
      .mockResolvedValueOnce({
        name: 'Sheet3',
        rowCount: 15,
        columnCount: 4,
        hasHeaders: true
      });

    (ExcelService as any).mockImplementation(() => ({
      parseFile: mockParseFile,
      getSheetData: mockGetSheetData
    }));

    render(
      <FileUploader 
        onFileUpload={mockOnFileUpload}
        onError={mockOnError}
      />
    );

    const file = new File(['test content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const dropZone = screen.getByText('Загрузите Excel файл').closest('div');
    fireEvent.drop(dropZone!, {
      dataTransfer: { files: [file] }
    });

    await waitFor(() => {
      expect(screen.getByText('Выберите лист для импорта')).toBeInTheDocument();
    });

    expect(screen.getByText('Sheet1')).toBeInTheDocument();
    expect(screen.getByText('Sheet2')).toBeInTheDocument();
    expect(screen.getByText('Sheet3')).toBeInTheDocument();
  });

  it('handles sheet selection', async () => {
    const multiSheetData: ExcelData = {
      ...mockExcelData,
      sheetNames: ['Sheet1', 'Sheet2']
    };

    const { ExcelService } = await import('@/services/ExcelService');
    const mockParseFile = vi.fn()
      .mockResolvedValueOnce(multiSheetData)
      .mockResolvedValueOnce({ ...mockExcelData, selectedSheet: 'Sheet2' });
    
    const mockGetSheetData = vi.fn()
      .mockResolvedValue({
        name: 'Sheet1',
        rowCount: 10,
        columnCount: 3,
        hasHeaders: true
      });

    (ExcelService as any).mockImplementation(() => ({
      parseFile: mockParseFile,
      getSheetData: mockGetSheetData
    }));

    render(
      <FileUploader 
        onFileUpload={mockOnFileUpload}
        onError={mockOnError}
      />
    );

    const file = new File(['test content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const dropZone = screen.getByText('Загрузите Excel файл').closest('div');
    fireEvent.drop(dropZone!, {
      dataTransfer: { files: [file] }
    });

    await waitFor(() => {
      expect(screen.getByText('Выберите лист для импорта')).toBeInTheDocument();
    });

    // Select Sheet2
    fireEvent.click(screen.getByText('Sheet1'));

    await waitFor(() => {
      expect(mockOnFileUpload).toHaveBeenCalledWith(
        expect.objectContaining({ selectedSheet: 'Sheet2' })
      );
    });
  });

  it('handles file validation errors', async () => {
    const { validateFileSize } = await import('@/utils/validators');
    (validateFileSize as any).mockReturnValue({
      isValid: false,
      error: 'File too large'
    });

    render(
      <FileUploader 
        onFileUpload={mockOnFileUpload}
        onError={mockOnError}
      />
    );

    const file = new File(['test content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const dropZone = screen.getByText('Загрузите Excel файл').closest('div');
    fireEvent.drop(dropZone!, {
      dataTransfer: { files: [file] }
    });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('File too large');
    });
  });

  it('handles parsing errors', async () => {
    const { ExcelService } = await import('@/services/ExcelService');
    const mockParseFile = vi.fn().mockRejectedValue(new Error('Parse error'));
    (ExcelService as any).mockImplementation(() => ({
      parseFile: mockParseFile
    }));

    render(
      <FileUploader 
        onFileUpload={mockOnFileUpload}
        onError={mockOnError}
      />
    );

    const file = new File(['test content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const dropZone = screen.getByText('Загрузите Excel файл').closest('div');
    fireEvent.drop(dropZone!, {
      dataTransfer: { files: [file] }
    });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Parse error');
    });
  });

  it('shows selected file info', async () => {
    render(
      <FileUploader 
        onFileUpload={mockOnFileUpload}
        onError={mockOnError}
      />
    );

    const file = new File(['test content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    // Mock the file processing to not complete immediately
    const { ExcelService } = await import('@/services/ExcelService');
    const mockParseFile = vi.fn().mockImplementation(() => new Promise(() => {}));
    (ExcelService as any).mockImplementation(() => ({
      parseFile: mockParseFile
    }));

    const dropZone = screen.getByText('Загрузите Excel файл').closest('div');
    fireEvent.drop(dropZone!, {
      dataTransfer: { files: [file] }
    });

    // File info should be shown during processing
    await waitFor(() => {
      expect(screen.getByText('test.xlsx')).toBeInTheDocument();
    });
  });

  it('allows canceling sheet selection', async () => {
    const multiSheetData: ExcelData = {
      ...mockExcelData,
      sheetNames: ['Sheet1', 'Sheet2']
    };

    const { ExcelService } = await import('@/services/ExcelService');
    const mockParseFile = vi.fn().mockResolvedValue(multiSheetData);
    const mockGetSheetData = vi.fn().mockResolvedValue({
      name: 'Sheet1',
      rowCount: 10,
      columnCount: 3,
      hasHeaders: true
    });

    (ExcelService as any).mockImplementation(() => ({
      parseFile: mockParseFile,
      getSheetData: mockGetSheetData
    }));

    render(
      <FileUploader 
        onFileUpload={mockOnFileUpload}
        onError={mockOnError}
      />
    );

    const file = new File(['test content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const dropZone = screen.getByText('Загрузите Excel файл').closest('div');
    fireEvent.drop(dropZone!, {
      dataTransfer: { files: [file] }
    });

    await waitFor(() => {
      expect(screen.getByText('Выберите лист для импорта')).toBeInTheDocument();
    });

    // Cancel selection
    fireEvent.click(screen.getByText('Отмена'));

    expect(screen.getByText('Загрузите Excel файл')).toBeInTheDocument();
    expect(mockOnFileUpload).not.toHaveBeenCalled();
  });
});
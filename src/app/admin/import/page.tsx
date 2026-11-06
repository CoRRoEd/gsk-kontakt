'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, CheckCircle2, Loader2, AlertCircle, ArrowDownToLine } from 'lucide-react';

export default function ImportPage() {
  const [downloadType, setDownloadType] = useState<'garages' | 'owners' | 'readings'>('owners');
  const [uploadType, setUploadType] = useState<'garages' | 'owners' | 'readings'>('owners');
  
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedType = localStorage.getItem('import_upload_type') as 'garages' | 'owners' | 'readings';
    if (savedType) setUploadType(savedType);
  }, []);

  const handleDownload = () => {
    window.location.href = `/api/admin/import/template?type=${downloadType}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleUploadTypeChange = (type: 'garages' | 'owners' | 'readings') => {
    setUploadType(type);
    localStorage.setItem('import_upload_type', type);
    setFile(null);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', uploadType);

    try {
      const res = await fetch('/api/admin/import/upload', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.ok) {
        setUploadResult({ success: true, message: data.data.message, rows: data.data.rows, errors: data.data.errors });
      } else {
        setUploadResult({ success: false, message: data.error?.message || 'Ошибка загрузки' });
      }
    } catch {
      setUploadResult({ success: false, message: 'Ошибка сети' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Импорт данных</h1>
        <p className="text-sm text-slate-500 mt-1">Загрузка реестров из Excel. Выполняйте шаги строго по порядку.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Скачивание шаблона */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Download size={24} /></div>
            <h2 className="text-lg font-bold text-slate-900">1. Скачать шаблон</h2>
          </div>

          <div className="space-y-4 mb-4 flex-1">
            <label className="flex items-start gap-2 cursor-pointer group">
              <input type="radio" name="downloadType" checked={downloadType === 'owners'} onChange={() => setDownloadType('owners')} className="mt-1 text-blue-600" />
              <div>
                <span className="text-sm font-semibold text-slate-800 block group-hover:text-blue-600 transition">Карточка объекта (1С)</span>
                <span className="text-xs text-slate-500 block">Основной файл: гаражи + собственники + характеристики</span>
              </div>
            </label>
            <label className="flex items-start gap-2 cursor-pointer group">
              <input type="radio" name="downloadType" checked={downloadType === 'garages'} onChange={() => setDownloadType('garages')} className="mt-1 text-blue-600" />
              <div>
                <span className="text-sm font-semibold text-slate-800 block group-hover:text-blue-600 transition">Только характеристики</span>
                <span className="text-xs text-slate-500 block">Для пустых гаражей или обновления площади/этажности</span>
              </div>
            </label>
            <label className="flex items-start gap-2 cursor-pointer group">
              <input type="radio" name="downloadType" checked={downloadType === 'readings'} onChange={() => setDownloadType('readings')} className="mt-1 text-blue-600" />
              <div>
                <span className="text-sm font-semibold text-slate-800 block group-hover:text-blue-600 transition">Показания ПУ</span>
                <span className="text-xs text-slate-500 block">Массовая загрузка расхода электроэнергии</span>
              </div>
            </label>
          </div>
          
          <button onClick={handleDownload} className="mt-auto flex items-center justify-center gap-2 w-full bg-slate-900 text-white px-4 py-3 rounded-xl hover:bg-slate-800 transition">
            <FileSpreadsheet size={18} /> Скачать шаблон .xlsx
          </button>
        </div>

        {/* Загрузка файла */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-2 rounded-lg text-green-600"><ArrowDownToLine size={24} /></div>
            <h2 className="text-lg font-bold text-slate-900">2. Загрузить файл</h2>
          </div>

          <div className="space-y-4 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100 flex-1">
            <label className="flex items-start gap-2 cursor-pointer group">
              <input type="radio" name="uploadType" checked={uploadType === 'owners'} onChange={() => handleUploadTypeChange('owners')} className="mt-1 text-green-600" />
              <div>
                <span className="text-sm font-semibold text-slate-800 block group-hover:text-green-600 transition">Карточка объекта (1С)</span>
                <span className="text-xs text-slate-500 block">Загрузка собственников и их гаражей</span>
              </div>
            </label>
            <label className="flex items-start gap-2 cursor-pointer group">
              <input type="radio" name="uploadType" checked={uploadType === 'garages'} onChange={() => handleUploadTypeChange('garages')} className="mt-1 text-green-600" />
              <div>
                <span className="text-sm font-semibold text-slate-800 block group-hover:text-green-600 transition">Только характеристики</span>
                <span className="text-xs text-slate-500 block">Загрузка/обновление гаражей без ФИО</span>
              </div>
            </label>
            <label className="flex items-start gap-2 cursor-pointer group">
              <input type="radio" name="uploadType" checked={uploadType === 'readings'} onChange={() => handleUploadTypeChange('readings')} className="mt-1 text-green-600" />
              <div>
                <span className="text-sm font-semibold text-slate-800 block group-hover:text-green-600 transition">Показания ПУ</span>
                <span className="text-xs text-slate-500 block">Загрузка показаний счётчиков</span>
              </div>
            </label>
          </div>

          <input type="file" accept=".xlsx" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

          <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-4 text-center transition cursor-pointer flex flex-col justify-center ${file ? 'border-green-400 bg-green-50' : 'border-slate-300 bg-white hover:bg-slate-50'}`}>
            {file ? (
              <><FileSpreadsheet className="mx-auto text-green-500 mb-2" size={28} /><p className="text-sm font-medium text-slate-700 truncate px-4">{file.name}</p><p className="text-xs text-green-600 mt-1">Файл выбран</p></>
            ) : (
              <><ArrowDownToLine className="mx-auto text-slate-400 mb-2" size={28} /><p className="text-sm font-medium text-slate-600">Нажмите для выбора файла</p><p className="text-xs text-slate-400 mt-1">Только формат .xlsx</p></>
            )}
          </div>

          <button onClick={handleUpload} disabled={!file || isUploading} className="mt-3 flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition">
            {isUploading ? <Loader2 className="animate-spin" size={18} /> : <ArrowDownToLine size={18} />}
            {isUploading ? 'Обработка...' : 'Загрузить в систему'}
          </button>
        </div>
      </div>

      {uploadResult && (
        <div className={`p-6 rounded-2xl border ${uploadResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <h3 className="font-semibold flex items-center gap-2">
            {uploadResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {uploadResult.success ? 'Успешно' : 'Ошибка'}
          </h3>
          <p className="text-sm mt-2">{uploadResult.message}</p>
          {uploadResult.success && uploadResult.errors && uploadResult.errors.length > 0 && (
            <div className="mt-4 bg-white rounded-lg p-4 border border-red-100">
              <p className="text-sm font-bold text-red-600 mb-2">Обнаружены ошибки в строках:</p>
              <ul className="text-xs text-red-500 list-disc list-inside space-y-1">
                {uploadResult.errors.map((err: string, idx: number) => <li key={idx}>{err}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
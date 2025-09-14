'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

interface CustomDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  maxDate?: Date;
  minDate?: Date;
  isRange?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  onRangeChange?: (startDate: Date | null, endDate: Date | null) => void;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function CustomDatePicker({
  selected,
  onChange,
  placeholder = 'Seleccionar fecha',
  className = '',
  disabled = false,
  required = false,
  maxDate,
  minDate,
  isRange = false,
  startDate,
  endDate,
  onRangeChange,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selected ? selected.getMonth() : new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(selected ? selected.getFullYear() : new Date().getFullYear());
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(selected);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(startDate || null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(endDate || null);
  const [selectingStartDate, setSelectingStartDate] = useState(true);

  // Funciones para manejar fechas sin problemas de zona horaria
  const stringToDate = (dateString: string) => {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Los meses en Date van de 0-11
      const day = parseInt(parts[2]);
      return new Date(year, month, day);
    }
    return null;
  };

  const dateToString = (date: Date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Sincronizar el estado interno cuando cambie la fecha seleccionada
  useEffect(() => {
    if (selected) {
      setCurrentMonth(selected.getMonth());
      setCurrentYear(selected.getFullYear());
      setTempSelectedDate(selected);
    }
  }, [selected]);
  
  // Sincronizar fecha temporal cuando se abre el calendario
  useEffect(() => {
    if (isOpen) {
      setTempSelectedDate(selected);
      if (isRange) {
        setTempStartDate(startDate);
        setTempEndDate(endDate);
        setSelectingStartDate(true);
      }
    }
  }, [isOpen, selected, isRange, startDate, endDate]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowYearDropdown(false);
        setShowMonthDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar dropdowns cuando se abre/cierra el calendario principal
  useEffect(() => {
    if (!isOpen) {
      setShowYearDropdown(false);
      setShowMonthDropdown(false);
    }
  }, [isOpen]);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateRange = () => {
    if (!isRange) return formatDate(selected);
    if (!startDate && !endDate) return '';
    if (startDate && !endDate) return `${formatDate(startDate)} - ...`;
    if (!startDate && endDate) return `... - ${formatDate(endDate)}`;
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const isDateInRange = (date: Date) => {
    if (!isRange || !tempStartDate) return false;
    if (!tempEndDate) return false;
    return date >= tempStartDate && date <= tempEndDate;
  };

  const isDateRangeStart = (date: Date) => {
    if (!isRange || !tempStartDate) return false;
    return date.getTime() === tempStartDate.getTime();
  };

  const isDateRangeEnd = (date: Date) => {
    if (!isRange || !tempEndDate) return false;
    return date.getTime() === tempEndDate.getTime();
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    const day = new Date(year, month, 1).getDay();
    // Convertir de domingo=0 a lunes=0
    return day === 0 ? 6 : day - 1;
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    if (!isDateDisabled(newDate)) {
      if (isRange) {
        if (selectingStartDate || !tempStartDate) {
          // Seleccionar fecha de inicio
          setTempStartDate(newDate);
          setTempEndDate(null);
          setSelectingStartDate(false);
        } else {
          // Seleccionar fecha de fin
          if (newDate >= tempStartDate) {
            setTempEndDate(newDate);
          } else {
            // Si la fecha es anterior a la de inicio, intercambiar
            setTempEndDate(tempStartDate);
            setTempStartDate(newDate);
          }
          setSelectingStartDate(true);
        }
      } else {
        setTempSelectedDate(newDate);
      }
    }
  };

  const handleApply = () => {
    if (isRange && onRangeChange) {
      onRangeChange(tempStartDate, tempEndDate);
    } else if (tempSelectedDate && onChange) {
      onChange(tempSelectedDate);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempSelectedDate(selected);
    if (isRange) {
      setTempStartDate(startDate);
      setTempEndDate(endDate);
      setSelectingStartDate(true);
    }
    setIsOpen(false);
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentYear, currentMonth + direction, 1);
    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
  };

  const generateYearOptions = () => {
    const currentYearValue = new Date().getFullYear();
    const years = [];
    // CRM inició en 2024, mostrar desde 2024 hasta 2026 máximo
    const startYear = 2024;
    const endYear = Math.min(2026, currentYearValue + 1); // Máximo 2026 o año actual + 1
    
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth, currentYear);
    const today = new Date();
    
    const days = [];
    
    // Días vacíos del mes anterior
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-9 h-9"></div>);
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      
      // Para modo normal (single date)
      const isSelected = !isRange && tempSelectedDate && 
        tempSelectedDate.getDate() === day &&
        tempSelectedDate.getMonth() === currentMonth &&
        tempSelectedDate.getFullYear() === currentYear;
      
      // Para modo rango
      const isRangeStart = isRange && isDateRangeStart(date);
      const isRangeEnd = isRange && isDateRangeEnd(date);
      const isInRange = isRange && isDateInRange(date);
      const isRangeSelected = isRangeStart || isRangeEnd;
      
      const isToday = 
        today.getDate() === day &&
        today.getMonth() === currentMonth &&
        today.getFullYear() === currentYear;
      const disabled = isDateDisabled(date);
      
      let dayClasses = 'w-9 h-9 text-sm font-medium transition-all duration-200 relative';
      
      if (disabled) {
        dayClasses += ' text-gray-300 cursor-not-allowed';
      } else if (isRange) {
        // Estilos para modo rango
        if (isRangeSelected) {
          dayClasses += ' bg-blue-600 text-white shadow-md rounded-full z-10';
        } else if (isInRange) {
          dayClasses += ' bg-blue-100 text-blue-800';
          // Agregar conectores visuales para el rango
          if (day > 1 && isDateInRange(new Date(currentYear, currentMonth, day - 1))) {
            dayClasses += ' rounded-l-none';
          } else {
            dayClasses += ' rounded-l-full';
          }
          if (day < daysInMonth && isDateInRange(new Date(currentYear, currentMonth, day + 1))) {
            dayClasses += ' rounded-r-none';
          } else {
            dayClasses += ' rounded-r-full';
          }
        } else if (isToday) {
          dayClasses += ' bg-blue-50 text-blue-600 border border-blue-200 rounded-full';
        } else {
          dayClasses += ' text-gray-800 hover:bg-blue-50 hover:text-blue-600 rounded-full cursor-pointer';
        }
      } else {
        // Estilos para modo normal
        if (isSelected) {
          dayClasses += ' bg-blue-600 text-white shadow-md rounded-full';
        } else if (isToday) {
          dayClasses += ' bg-blue-50 text-blue-600 border border-blue-200 rounded-full';
        } else {
          dayClasses += ' text-gray-800 hover:bg-blue-50 hover:text-blue-600 rounded-full cursor-pointer';
        }
      }
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={disabled}
          className={dayClasses}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={formatDateRange()}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          className={`w-full px-3 py-2 pl-10 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer hover:border-gray-400 font-sans ${isRange ? 'min-w-[200px]' : 'min-w-[140px]'}`}
        />
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
      
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 bg-white border-2 border-gray-300 rounded-xl shadow-2xl z-50 p-4 min-w-[280px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fechas seleccionadas para modo rango */}
          {isRange && tempStartDate && (
            <div className="mb-3 p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700 font-medium">
                Fechas seleccionadas
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Inicio: {formatDate(tempStartDate)}
                {tempEndDate && ` • Fin: ${formatDate(tempEndDate)}`}
              </p>
            </div>
          )}
          
          {/* Header con navegación */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowMonthDropdown(!showMonthDropdown);
                    setShowYearDropdown(false); // Cerrar el otro dropdown
                  }}
                  className="px-3 py-1 text-sm font-bold text-gray-900 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors border border-gray-300 min-w-[100px]"
                >
                  {MONTHS[currentMonth]}
                </button>
                {showMonthDropdown && (
                  <div 
                    className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-[9999] max-h-48 overflow-y-auto overscroll-contain"
                    onWheel={(e) => {
                      e.stopPropagation();
                      const element = e.currentTarget;
                      const { scrollTop, scrollHeight, clientHeight } = element;
                      
                      // Si estamos en el límite superior o inferior, prevenir scroll de la página
                      if ((e.deltaY < 0 && scrollTop === 0) || 
                          (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight)) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {MONTHS.map((month, index) => (
                      <button
                        key={month}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentMonth(index);
                          setShowMonthDropdown(false);
                        }}
                        className={`
                          block w-full px-4 py-2.5 text-sm text-left font-medium transition-colors
                          ${index === currentMonth 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-900 hover:bg-blue-50 hover:text-blue-600'
                          }
                        `}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="relative">
                <button
                  onClick={() => {
                    setShowYearDropdown(!showYearDropdown);
                    setShowMonthDropdown(false); // Cerrar el otro dropdown
                  }}
                  className="px-3 py-1 text-sm font-bold text-gray-900 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors border border-gray-300 min-w-[80px]"
                >
                  {currentYear}
                </button>
                {showYearDropdown && (
                  <div 
                    className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-[9999] max-h-48 overflow-y-auto overscroll-contain"
                    onWheel={(e) => {
                      e.stopPropagation();
                      const element = e.currentTarget;
                      const { scrollTop, scrollHeight, clientHeight } = element;
                      
                      // Si estamos en el límite superior o inferior, prevenir scroll de la página
                      if ((e.deltaY < 0 && scrollTop === 0) || 
                          (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight)) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {generateYearOptions().map((year) => (
                      <button
                        key={year}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentYear(year);
                          setShowYearDropdown(false);
                        }}
                        className={`
                          block w-full px-4 py-2.5 text-sm text-left font-medium transition-colors
                          ${year === currentYear 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-900 hover:bg-blue-50 hover:text-blue-600'
                          }
                        `}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={() => navigateMonth(1)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div key={day} className="text-xs font-bold text-gray-700 text-center p-1">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendario */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {renderCalendar()}
          </div>
          
          {/* Botones de acción */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 inline mr-1" />
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isRange ? (!tempStartDate || !tempEndDate) : !tempSelectedDate}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4 inline mr-1" />
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
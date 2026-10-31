import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { searchCities } from './lib/moroccoCities';

type CityComboboxProps = {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  className?: string;
};

export function CityCombobox({ value, onChange, placeholder = 'Rechercher une ville…', className = '' }: CityComboboxProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => searchCities(open ? query : ''), [open, query]);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (wrapperRef.current?.contains(event.target as Node)) return;
      setOpen(false);
      setQuery(value);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [value]);

  const select = (city: string) => {
    onChange(city);
    setQuery(city);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      if (open && results[active]) {
        event.preventDefault();
        select(results[active]);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
      setQuery(value);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <MapPin size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className={`w-full rounded-xl border border-white/10 p-3 pl-9 pr-9 text-white placeholder:text-stone/60 ${className}`}
      />
      {(value || query) && (
        <button type="button" aria-label="Effacer la ville" onClick={() => { onChange(''); setQuery(''); setOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-white">
          <X size={16} />
        </button>
      )}
      {open && (
        <ul id={listId} role="listbox" className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-white/10 bg-[#0b0c0e] py-1 shadow-xl">
          {results.length === 0 && <li className="px-3 py-2 text-sm text-stone">Aucune ville trouvée</li>}
          {results.map((city, index) => (
            <li
              key={city}
              role="option"
              aria-selected={city === value}
              onMouseDown={(event) => { event.preventDefault(); select(city); }}
              onMouseEnter={() => setActive(index)}
              className={`cursor-pointer px-3 py-2 text-sm ${index === active ? 'bg-ember text-white' : 'text-white hover:bg-white/5'}`}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

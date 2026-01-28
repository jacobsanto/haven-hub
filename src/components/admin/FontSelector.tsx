import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface FontSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  fonts: string[];
  placeholder?: string;
}

export function FontSelector({ value, onValueChange, fonts, placeholder = "Select a font" }: FontSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          style={value ? { fontFamily: `"${value}", sans-serif` } : undefined}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search fonts..." />
          <CommandList>
            <CommandEmpty>No font found.</CommandEmpty>
            <CommandGroup>
              {fonts.map((font) => (
                <CommandItem
                  key={font}
                  value={font}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? '' : font);
                    setOpen(false);
                  }}
                  style={{ fontFamily: `"${font}", sans-serif` }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === font ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {font}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

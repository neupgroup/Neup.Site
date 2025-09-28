import { FC } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface PropertyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
}

const PropertyInput: FC<PropertyInputProps> = ({ label, value, onChange, placeholder, suggestions }) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {suggestions.map((suggestion) => (
            <Badge
              key={suggestion}
              variant={value === suggestion ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => onChange(suggestion)}
            >
              {suggestion}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyInput;

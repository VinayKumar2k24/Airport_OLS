import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';

interface RunwaySelectorProps {
  runways: string[];
  selectedRunway: string;
  onSelect: (runway: string) => void;
  disabled?: boolean;
}

export const RunwaySelector: React.FC<RunwaySelectorProps> = ({
  runways,
  selectedRunway,
  onSelect,
  disabled = false,
}) => {
  const handleChange = (event: SelectChangeEvent) => {
    onSelect(event.target.value);
  };

  const safeSelectedValue = typeof selectedRunway === 'string'
    ? selectedRunway
    : (selectedRunway as any)?.runway || (selectedRunway as any)?.runway_name || '';

  return (
    <FormControl 
      variant="outlined" 
      size="small" 
      sx={{ 
        minWidth: 150,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 1,
        '& .MuiOutlinedInput-root': {
          color: '#ffffff',
          '& fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.2)',
          },
          '&:hover fieldset': {
            borderColor: '#1E90FF',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#1E90FF',
          },
        },
        '& .MuiInputLabel-root': {
          color: 'rgba(255, 255, 255, 0.7)',
          '&.Mui-focused': {
            color: '#1E90FF',
          },
        },
      }}
    >
      <InputLabel id="runway-select-label">Runway</InputLabel>
      <Select
        labelId="runway-select-label"
        id="runway-select"
        value={safeSelectedValue}
        label="Runway"
        onChange={handleChange}
        disabled={disabled || runways.length === 0}
        MenuProps={{
          PaperProps: {
            sx: {
              backgroundColor: '#0A1628',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
            },
          },
        }}
      >
        {runways.map((item: any, idx: number) => {
          const val = typeof item === 'string' ? item : item?.runway || item?.runway_name || String(item);
          return (
            <MenuItem key={val || idx} value={val}>
              {val}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};
export default RunwaySelector;

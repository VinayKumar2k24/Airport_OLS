import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';

interface AirportSelectorProps {
  airports: string[];
  selectedIcao: string;
  onSelect: (icao: string) => void;
  disabled?: boolean;
}

export const AirportSelector: React.FC<AirportSelectorProps> = ({
  airports,
  selectedIcao,
  onSelect,
  disabled = false,
}) => {
  const handleChange = (event: SelectChangeEvent) => {
    onSelect(event.target.value);
  };

  const safeSelectedValue = typeof selectedIcao === 'string' 
    ? selectedIcao 
    : (selectedIcao as any)?.ICAO || (selectedIcao as any)?.icao || '';

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
      <InputLabel id="airport-select-label">Airport ICAO</InputLabel>
      <Select
        labelId="airport-select-label"
        id="airport-select"
        value={safeSelectedValue}
        label="Airport ICAO"
        onChange={handleChange}
        disabled={disabled}
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
        {airports.map((item: any, idx: number) => {
          const val = typeof item === 'string' ? item : item?.ICAO || item?.icao || String(item);
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
export default AirportSelector;

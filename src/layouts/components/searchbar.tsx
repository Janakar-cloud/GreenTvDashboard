import type { BoxProps } from '@mui/material/Box';

import { useState, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Input from '@mui/material/Input';
import Slide from '@mui/material/Slide';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import ClickAwayListener from '@mui/material/ClickAwayListener';

import { globalSearch } from 'src/api/search';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function Searchbar({ sx, ...other }: BoxProps) {
  const theme = useTheme();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ label: string; items: string[] }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await globalSearch({ q: query.trim(), type: 'all', limit: 5 });
      const next: { label: string; items: string[] }[] = [];
      if (data.results.media && Array.isArray(data.results.media)) next.push({ label: 'Media', items: data.results.media.map((i) => i.title || 'Media item') });
      if (data.results.articles && Array.isArray(data.results.articles)) next.push({ label: 'Articles', items: data.results.articles.map((i) => i.title || 'Article') });
      setResults(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <div>
        {!open && (
          <IconButton onClick={handleOpen}>
            <Iconify icon="eva:search-fill" />
          </IconButton>
        )}

        <Slide direction="down" in={open} mountOnEnter unmountOnExit>
          <Box
            sx={{
              top: 0,
              left: 0,
              zIndex: 99,
              width: '100%',
              display: 'flex',
              position: 'absolute',
              alignItems: 'center',
              px: { xs: 3, md: 5 },
              boxShadow: theme.vars.customShadows.z8,
              height: {
                xs: 'var(--layout-header-mobile-height)',
                md: 'var(--layout-header-desktop-height)',
              },
              backdropFilter: `blur(6px)`,
              WebkitBackdropFilter: `blur(6px)`,
              backgroundColor: varAlpha(theme.vars.palette.background.defaultChannel, 0.8),
              ...sx,
            }}
            {...other}
          >
            <Input
              autoFocus
              fullWidth
              disableUnderline
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <Iconify width={20} icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              }
              sx={{ fontWeight: 'fontWeightBold' }}
            />
            <Button variant="contained" onClick={handleSearch} disabled={loading}>
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Search'}
            </Button>
          </Box>
        </Slide>
        {open && (results.length > 0 || loading || error) && (
          <Box
            sx={{
              position: 'absolute',
              top: 'var(--layout-header-desktop-height)',
              left: 0,
              right: 0,
              zIndex: 100,
              backgroundColor: 'background.paper',
              boxShadow: theme.vars.customShadows.z8,
              maxHeight: 320,
              overflowY: 'auto',
            }}
          >
            {error && (
              <Box p={2}>
                <Typography color="error" variant="body2">{error}</Typography>
              </Box>
            )}
            {loading && (
              <Box p={2} display="flex" alignItems="center" gap={1}>
                <CircularProgress size={18} />
                <Typography variant="body2">Searching…</Typography>
              </Box>
            )}
            {!loading && !error && results.map((group, idx) => (
              <Box key={group.label}>
                <Box px={2} pt={1} pb={0.5}>
                  <Typography variant="overline" color="text.secondary">{group.label}</Typography>
                </Box>
                <List dense disablePadding>
                  {group.items.slice(0, 5).map((item, i) => (
                    <ListItem key={`${group.label}-${i}`}>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
                {idx < results.length - 1 && <Divider />}
              </Box>
            ))}
            {!loading && !error && results.length === 0 && query.trim() && (
              <Box p={2}>
                <Typography variant="body2">No results found.</Typography>
              </Box>
            )}
          </Box>
        )}
      </div>
    </ClickAwayListener>
  );
}

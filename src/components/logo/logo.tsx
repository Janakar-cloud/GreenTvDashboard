import type { LinkProps } from '@mui/material/Link';

import { useId } from 'react';
import { mergeClasses } from 'minimal-shared/utils';

import Link from '@mui/material/Link';
import { Box, Typography } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

import { logoClasses } from './classes';
import leafImg from "../logo/GREENTVLOGO.png";

// ----------------------------------------------------------------------

export type LogoProps = LinkProps & {
  isSingle?: boolean;
  disabled?: boolean;
};

export function Logo({
  sx,
  disabled,
  className,
  href = '/',
  isSingle = true,
  ...other
}: LogoProps) {
  const theme = useTheme();
  const gradientId = useId();

  const TEXT_PRIMARY = theme.vars.palette.text.primary;
  const _PRIMARY_LIGHT = theme.vars.palette.primary.light;
  const PRIMARY_MAIN = theme.vars.palette.primary.main;
  const PRIMARY_DARKER = theme.vars.palette.primary.dark;

  // ---------------- FULL SVG LOGO ----------------
  const fullLogo = (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 360 128"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${gradientId}-1`}>
          <stop stopColor={PRIMARY_DARKER} />
          <stop offset="1" stopColor={PRIMARY_MAIN} />
        </linearGradient>
      </defs>

      {/* Keep your existing SVG paths here (unchanged) */}
      <text x="140" y="80" fill={TEXT_PRIMARY} fontSize="28" fontWeight="bold">
        Green TV
      </text>
    </svg>
  );

  // ---------------- MAIN RETURN ----------------
  return (
    <LogoRoot
      component={RouterLink}
      href={href}
      aria-label="Logo"
      underline="none"
      className={mergeClasses([logoClasses.root, className])}
      sx={[
        {
          width: 80, // IMPORTANT FIX
          height: 60,
          display: 'inline-flex',
          alignItems: 'center',
          ...(disabled && { pointerEvents: 'none' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {isSingle ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          
          {/* Logo Image */}
          <Box
            component="img"
            src={leafImg}
            alt="logo"
            sx={{ width: 50, height: 50 }}
          />

          {/* Single-line Text */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "green",
              whiteSpace: "nowrap", // prevents line break
              lineHeight: 1,
              fontSize: { xs: 14, sm: 16, md: 18 }, // responsive
            }}
          >
            Green Generation TV
          </Typography>
        </Box>
      ) : (
        fullLogo
      )}
    </LogoRoot>
  );
}

// ----------------------------------------------------------------------

const LogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  color: 'transparent',
  display: 'inline-flex',
  alignItems: 'center',
}));
import React from 'react';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  legacyBehavior?: boolean;
  passHref?: boolean;
  children?: React.ReactNode;
}

const Link = ({
  href,
  children,
  prefetch: _prefetch,
  replace: _replace,
  scroll: _scroll,
  shallow: _shallow,
  legacyBehavior: _legacyBehavior,
  passHref: _passHref,
  ...props
}: LinkProps) => <a href={href} {...props}>{children}</a>;

export default Link;

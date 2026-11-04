export type SwipeNavItem = {
  href: string;
  isActive?: (pathname: string) => boolean;
};

function itemActive(item: SwipeNavItem, pathname: string) {
  if (item.isActive) return item.isActive(pathname);
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Page suivante / précédente dans la barre de navigation. */
export function adjacentNavHref(
  items: SwipeNavItem[],
  pathname: string,
  direction: -1 | 1,
): string | null {
  if (items.length < 2) return null;
  const index = items.findIndex((item) => itemActive(item, pathname));
  if (index < 0) return null;
  const next = items[index + direction];
  return next?.href ?? null;
}

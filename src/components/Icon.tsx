// Icon.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library, IconDefinition, IconPrefix } from '@fortawesome/fontawesome-svg-core';
import { findIconDefinition, IconLookup } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { DynamicIconProps } from '@/types/Icon';

// 將所有圖標添加到庫中
library.add(fas, far, fab);

const getIcon = (iconName: string, prefix: IconPrefix): IconDefinition | null => {
  const iconLookup: IconLookup = { prefix, iconName: iconName as any };
  return findIconDefinition(iconLookup);
};

const DynamicIcon: React.FC<DynamicIconProps> = ({ iconName, prefix, className }) => {
  const iconDef = getIcon(iconName, prefix);

  if (!iconDef) {
    return <span className={className}>{iconName}</span>;
  }

  return <FontAwesomeIcon icon={iconDef} className={className} />;
};

export default DynamicIcon;

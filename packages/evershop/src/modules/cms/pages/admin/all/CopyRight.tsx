import React from 'react';

interface CopyRightProps {
  themeConfig: {
    copyRight: string;
  };
}
export default function CopyRight({
  themeConfig: { copyRight }
}: CopyRightProps) {
  return (
    <div className="copyright">
      <span>{copyRight}</span>
    </div>
  );
}

CopyRight.defaultProps = {
  themeConfig: {
    copyRight: `© ${new Date().getFullYear()} Full House. All rights reserved.`
  }
};

export const layout = {
  areaId: 'footerLeft',
  sortOrder: 10
};

export const query = `
  query query {
    themeConfig {
      copyRight
    }
  }
`;

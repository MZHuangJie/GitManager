import type { ThemeConfig } from 'antd'

// 可爱风格的通用 token
const cuteToken = {
  borderRadius: 12,
  borderRadiusLG: 14,
  borderRadiusSM: 8,
  borderRadiusXS: 6,
  fontSize: 14,
  fontSizeLG: 16,
  fontSizeSM: 12,
  fontFamily: `'Nunito', 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif`,
  lineHeight: 1.6,
  controlHeight: 36,
  controlHeightSM: 28,
  paddingContentHorizontal: 16,
  paddingContentVertical: 12
}

// 亮色主题 - 奶油草莓
export const lightTheme: ThemeConfig = {
  token: {
    ...cuteToken,
    colorPrimary: '#f7859b',
    colorPrimaryBg: '#fff0f3',
    colorPrimaryBgHover: '#ffe4e8',
    colorPrimaryBorder: '#f7b8c4',
    colorPrimaryHover: '#f99eb0',
    colorPrimaryActive: '#e86b83',
    colorSuccess: '#7ecb9a',
    colorWarning: '#f5c26b',
    colorError: '#f07c82',
    colorInfo: '#8cb4f5',
    colorTextBase: '#2d2026',
    colorBgBase: '#fef9f5',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBorder: '#f0dde2',
    colorBorderSecondary: '#f5e8ec',
    colorFill: '#fff0f3',
    colorFillSecondary: '#fef5f6',
    colorFillTertiary: '#fff5f5',
    colorText: '#2d2026',
    colorTextSecondary: '#6e5a63',
    colorTextTertiary: '#9b8790',
    colorTextQuaternary: '#c4b3ba',
    boxShadow: '0 2px 12px rgba(247, 133, 155, 0.12)',
    boxShadowSecondary: '0 4px 20px rgba(247, 133, 155, 0.08)'
  },
  components: {
    Button: {
      borderRadius: 10,
      controlHeight: 36,
      controlHeightSM: 28,
      primaryShadow: '0 2px 8px rgba(247, 133, 155, 0.3)'
    },
    Card: {
      borderRadius: 14,
      boxShadow: '0 2px 12px rgba(247, 133, 155, 0.06)'
    },
    Tag: {
      borderRadius: 6
    },
    Modal: {
      borderRadius: 16,
      boxShadow: '0 8px 40px rgba(0,0,0,0.08)'
    },
    Table: {
      borderRadius: 12,
      headerBg: '#fff5f7',
      borderColor: '#f5e8ec'
    }
  }
}

// 暗色主题 - 薰衣草夜空
export const darkTheme: ThemeConfig = {
  token: {
    ...cuteToken,
    colorPrimary: '#c4a7f5',
    colorPrimaryBg: '#1e1833',
    colorPrimaryBgHover: '#2a2245',
    colorPrimaryBorder: '#4a3d73',
    colorPrimaryHover: '#d4bef8',
    colorPrimaryActive: '#b08eeb',
    colorSuccess: '#6fcf97',
    colorWarning: '#f0c274',
    colorError: '#e8837a',
    colorInfo: '#8ec5f7',
    colorTextBase: '#e4dff2',
    colorBgBase: '#1a1625',
    colorBgContainer: '#231f33',
    colorBgElevated: '#2c2740',
    colorBorder: '#383250',
    colorBorderSecondary: '#2e2845',
    colorFill: '#1e1833',
    colorFillSecondary: '#25203a',
    colorFillTertiary: '#2c2745',
    colorText: '#e4dff2',
    colorTextSecondary: '#a69cc0',
    colorTextTertiary: '#7b7299',
    colorTextQuaternary: '#5a5275',
    boxShadow: '0 2px 12px rgba(150, 130, 200, 0.15)',
    boxShadowSecondary: '0 4px 20px rgba(150, 130, 200, 0.08)'
  },
  components: {
    Button: {
      borderRadius: 10,
      controlHeight: 36,
      controlHeightSM: 28,
      primaryShadow: '0 2px 8px rgba(196, 167, 245, 0.3)'
    },
    Card: {
      borderRadius: 14,
      boxShadow: '0 2px 12px rgba(150, 130, 200, 0.08)'
    },
    Tag: {
      borderRadius: 6
    },
    Modal: {
      borderRadius: 16,
      boxShadow: '0 8px 40px rgba(0,0,0,0.3)'
    },
    Table: {
      borderRadius: 12,
      headerBg: '#1e1833',
      borderColor: '#2e2845'
    }
  }
}

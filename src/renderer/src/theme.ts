import type { ThemeConfig } from 'antd'
import { ThemeMode } from '@shared/types'

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
const lightTheme: ThemeConfig = {
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
    Button: { borderRadius: 10, controlHeight: 36, controlHeightSM: 28, primaryShadow: '0 2px 8px rgba(247, 133, 155, 0.3)' },
    Card: { borderRadius: 14, boxShadow: '0 2px 12px rgba(247, 133, 155, 0.06)' },
    Tag: { borderRadius: 6 },
    Modal: { borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.08)' },
    Table: { borderRadius: 12, headerBg: '#fff5f7', borderColor: '#f5e8ec' }
  }
}

// 暗色主题 - 薰衣草夜空
const darkTheme: ThemeConfig = {
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
    Button: { borderRadius: 10, controlHeight: 36, controlHeightSM: 28, primaryShadow: '0 2px 8px rgba(196, 167, 245, 0.3)' },
    Card: { borderRadius: 14, boxShadow: '0 2px 12px rgba(150, 130, 200, 0.08)' },
    Tag: { borderRadius: 6 },
    Modal: { borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.3)' },
    Table: { borderRadius: 12, headerBg: '#1e1833', borderColor: '#2e2845' }
  }
}

// 薄荷森林 - 清新绿色
const forestTheme: ThemeConfig = {
  token: {
    ...cuteToken,
    colorPrimary: '#6aab8e',
    colorPrimaryBg: '#eef7f1',
    colorPrimaryBgHover: '#ddefe4',
    colorPrimaryBorder: '#a3d1b9',
    colorPrimaryHover: '#84c0a4',
    colorPrimaryActive: '#4f9675',
    colorSuccess: '#6aab8e',
    colorWarning: '#e8b96b',
    colorError: '#d9746b',
    colorInfo: '#7eb8d4',
    colorTextBase: '#24332b',
    colorBgBase: '#f4f9f5',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBorder: '#d4e8dc',
    colorBorderSecondary: '#e4f2e8',
    colorFill: '#eef7f1',
    colorFillSecondary: '#f5faf6',
    colorFillTertiary: '#fafcfa',
    colorText: '#24332b',
    colorTextSecondary: '#5a7563',
    colorTextTertiary: '#879e8f',
    colorTextQuaternary: '#b0c4b7',
    boxShadow: '0 2px 12px rgba(106, 171, 142, 0.12)',
    boxShadowSecondary: '0 4px 20px rgba(106, 171, 142, 0.08)'
  },
  components: {
    Button: { borderRadius: 10, controlHeight: 36, controlHeightSM: 28, primaryShadow: '0 2px 8px rgba(106, 171, 142, 0.3)' },
    Card: { borderRadius: 14, boxShadow: '0 2px 12px rgba(106, 171, 142, 0.06)' },
    Tag: { borderRadius: 6 },
    Modal: { borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.08)' },
    Table: { borderRadius: 12, headerBg: '#f0f7f3', borderColor: '#e4f2e8' }
  }
}

// 深海暗流 - 蓝色暗系
const oceanTheme: ThemeConfig = {
  token: {
    ...cuteToken,
    colorPrimary: '#6db3d8',
    colorPrimaryBg: '#172433',
    colorPrimaryBgHover: '#1f3145',
    colorPrimaryBorder: '#3a5a7a',
    colorPrimaryHover: '#8ec5f7',
    colorPrimaryActive: '#4e99c4',
    colorSuccess: '#6fcf97',
    colorWarning: '#e8c576',
    colorError: '#e8837a',
    colorInfo: '#8ec5f7',
    colorTextBase: '#dee8f0',
    colorBgBase: '#1a2129',
    colorBgContainer: '#232c36',
    colorBgElevated: '#2b3542',
    colorBorder: '#34485a',
    colorBorderSecondary: '#2a3d4e',
    colorFill: '#172433',
    colorFillSecondary: '#1f2f40',
    colorFillTertiary: '#25384d',
    colorText: '#dee8f0',
    colorTextSecondary: '#9bb4c4',
    colorTextTertiary: '#6e8fa3',
    colorTextQuaternary: '#4d6b80',
    boxShadow: '0 2px 12px rgba(100, 160, 210, 0.15)',
    boxShadowSecondary: '0 4px 20px rgba(100, 160, 210, 0.08)'
  },
  components: {
    Button: { borderRadius: 10, controlHeight: 36, controlHeightSM: 28, primaryShadow: '0 2px 8px rgba(109, 179, 216, 0.3)' },
    Card: { borderRadius: 14, boxShadow: '0 2px 12px rgba(100, 160, 210, 0.08)' },
    Tag: { borderRadius: 6 },
    Modal: { borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.3)' },
    Table: { borderRadius: 12, headerBg: '#1a2433', borderColor: '#2a3d4e' }
  }
}

// 日落余晖 - 暖橙暗系
const sunsetTheme: ThemeConfig = {
  token: {
    ...cuteToken,
    colorPrimary: '#e8a87c',
    colorPrimaryBg: '#2e1f1a',
    colorPrimaryBgHover: '#3d2a24',
    colorPrimaryBorder: '#6b4238',
    colorPrimaryHover: '#f0be9a',
    colorPrimaryActive: '#d48f63',
    colorSuccess: '#7ecb9a',
    colorWarning: '#f0c274',
    colorError: '#e8837a',
    colorInfo: '#d4a87c',
    colorTextBase: '#f0e4dc',
    colorBgBase: '#241e1a',
    colorBgContainer: '#302822',
    colorBgElevated: '#3c322a',
    colorBorder: '#524338',
    colorBorderSecondary: '#44362d',
    colorFill: '#2e1f1a',
    colorFillSecondary: '#352620',
    colorFillTertiary: '#402e26',
    colorText: '#f0e4dc',
    colorTextSecondary: '#b8a394',
    colorTextTertiary: '#8a7568',
    colorTextQuaternary: '#635248',
    boxShadow: '0 2px 12px rgba(200, 140, 100, 0.15)',
    boxShadowSecondary: '0 4px 20px rgba(200, 140, 100, 0.08)'
  },
  components: {
    Button: { borderRadius: 10, controlHeight: 36, controlHeightSM: 28, primaryShadow: '0 2px 8px rgba(232, 168, 124, 0.3)' },
    Card: { borderRadius: 14, boxShadow: '0 2px 12px rgba(200, 140, 100, 0.08)' },
    Tag: { borderRadius: 6 },
    Modal: { borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.3)' },
    Table: { borderRadius: 12, headerBg: '#2a1f1a', borderColor: '#44362d' }
  }
}

// 毛玻璃 - 轻透磨砂质感
const glassTheme: ThemeConfig = {
  token: {
    ...cuteToken,
    colorPrimary: '#8b9dc3',
    colorPrimaryBg: 'rgba(220, 225, 240, 0.5)',
    colorPrimaryBgHover: 'rgba(210, 216, 234, 0.6)',
    colorPrimaryBorder: 'rgba(180, 190, 215, 0.5)',
    colorPrimaryHover: '#9aacd0',
    colorPrimaryActive: '#7185b0',
    colorSuccess: '#7ecb9a',
    colorWarning: '#e8c576',
    colorError: '#e8837a',
    colorInfo: '#8baed4',
    colorTextBase: '#3a3f50',
    colorBgBase: '#f2f4f8',
    colorBgContainer: 'rgba(255,255,255,0.65)',
    colorBgElevated: 'rgba(255,255,255,0.82)',
    colorBorder: 'rgba(190, 196, 215, 0.45)',
    colorBorderSecondary: 'rgba(200, 206, 224, 0.35)',
    colorFill: 'rgba(220, 225, 240, 0.4)',
    colorFillSecondary: 'rgba(230, 234, 246, 0.5)',
    colorFillTertiary: 'rgba(240, 242, 250, 0.6)',
    colorText: '#3a3f50',
    colorTextSecondary: '#6e7488',
    colorTextTertiary: '#9a9fb5',
    colorTextQuaternary: '#c4c7d5',
    boxShadow: '0 4px 24px rgba(140, 150, 180, 0.12)',
    boxShadowSecondary: '0 8px 32px rgba(140, 150, 180, 0.08)'
  },
  components: {
    Button: { borderRadius: 10, controlHeight: 36, controlHeightSM: 28, primaryShadow: '0 2px 12px rgba(139, 157, 195, 0.25)' },
    Card: { borderRadius: 14, boxShadow: '0 4px 20px rgba(140, 150, 180, 0.08)' },
    Tag: { borderRadius: 6 },
    Modal: { borderRadius: 16, boxShadow: '0 8px 48px rgba(0,0,0,0.1)' },
    Table: { borderRadius: 12, headerBg: 'rgba(230,234,245,0.5)', borderColor: 'rgba(200,206,224,0.4)' }
  }
}

// 未来主义 - 霓虹赛博暗系
const cyberTheme: ThemeConfig = {
  token: {
    ...cuteToken,
    borderRadius: 4,
    borderRadiusLG: 6,
    borderRadiusSM: 3,
    borderRadiusXS: 2,
    colorPrimary: '#00e5ff',
    colorPrimaryBg: '#0a1628',
    colorPrimaryBgHover: '#0f1f38',
    colorPrimaryBorder: '#1e3a5f',
    colorPrimaryHover: '#33eaff',
    colorPrimaryActive: '#00b8d4',
    colorSuccess: '#00e676',
    colorWarning: '#ffab00',
    colorError: '#ff1744',
    colorInfo: '#00b0ff',
    colorTextBase: '#e0f0ff',
    colorBgBase: '#060d17',
    colorBgContainer: '#0d1525',
    colorBgElevated: '#141e30',
    colorBorder: '#1a3050',
    colorBorderSecondary: '#152540',
    colorFill: '#0a1628',
    colorFillSecondary: '#0f1d35',
    colorFillTertiary: '#122442',
    colorText: '#e0f0ff',
    colorTextSecondary: '#7bb8e0',
    colorTextTertiary: '#4d80a8',
    colorTextQuaternary: '#2a5070',
    boxShadow: '0 0 20px rgba(0, 229, 255, 0.1), 0 4px 16px rgba(0,0,0,0.4)',
    boxShadowSecondary: '0 0 12px rgba(0, 229, 255, 0.06), 0 4px 12px rgba(0,0,0,0.3)'
  },
  components: {
    Button: { borderRadius: 4, controlHeight: 36, controlHeightSM: 28, primaryShadow: '0 0 16px rgba(0, 229, 255, 0.35)' },
    Card: { borderRadius: 6, boxShadow: '0 0 16px rgba(0, 229, 255, 0.06), 0 4px 16px rgba(0,0,0,0.4)' },
    Tag: { borderRadius: 3 },
    Modal: { borderRadius: 8, boxShadow: '0 0 40px rgba(0, 229, 255, 0.12), 0 12px 48px rgba(0,0,0,0.5)' },
    Table: { borderRadius: 4, headerBg: '#0d1a30', borderColor: '#152540' }
  }
}

export const themes: Record<ThemeMode, ThemeConfig> = {
  light: lightTheme,
  dark: darkTheme,
  forest: forestTheme,
  ocean: oceanTheme,
  sunset: sunsetTheme,
  glass: glassTheme,
  cyber: cyberTheme
}

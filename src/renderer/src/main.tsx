import './styles/global.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useEffect } from 'react'
import { useStore } from './stores'
import { lightTheme, darkTheme } from './theme'
import App from './App'

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const themeMode = useStore((s) => s.themeMode)
  const themeConfig = themeMode === 'light' ? lightTheme : darkTheme

  useEffect(() => {
    document.body.setAttribute('data-theme', themeMode)
  }, [themeMode])

  return (
    <ConfigProvider
      locale={zhCN}
      theme={themeConfig}
    >
      {children}
    </ConfigProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeWrapper>
      <App />
    </ThemeWrapper>
  </React.StrictMode>
)

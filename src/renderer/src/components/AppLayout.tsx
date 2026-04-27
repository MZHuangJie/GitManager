import { Layout } from 'antd'
import AppSider from './AppSider'
import AppContent from './AppContent'

export default function AppLayout() {
  return (
    <Layout style={{ height: '100vh' }}>
      <AppSider />
      <AppContent />
    </Layout>
  )
}

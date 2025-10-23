/**
 * Authentication IPC Handlers
 * Handles user login and authentication
 */

import { ipcMain } from 'electron'
import bcrypt from 'bcryptjs'

export function registerAuthHandlers(prisma: any) {
  ipcMain.handle('auth:login', async (_, { username, password }) => {
    try {
      if (prisma) {
        const user = await prisma.user.findUnique({ where: { username } })
        if (!user) {
          console.log(`❌ Login failed: User '${username}' not found`)
          return { success: false, message: 'Invalid username or password' }
        }

        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) {
          console.log(`❌ Login failed: Invalid password for user '${username}'`)
          return { success: false, message: 'Invalid username or password' }
        }

        console.log(`✅ Login successful: ${user.username} (${user.role}) - ID: ${user.id}`)
        return { success: true, user: { id: user.id, username: user.username, role: user.role } }
      }

      // Mock fallback
      console.warn('⚠️ Using mock login - database not available')
      return { success: true, user: { id: '1', username, role: 'admin' } }
    } catch (error) {
      console.error('❌ Login error:', error)
      return { success: false, message: 'An error occurred during login' }
    }
  })
}

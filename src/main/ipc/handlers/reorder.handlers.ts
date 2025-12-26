import { ipcMain } from 'electron';
import { PrismaClient } from '../../generated/prisma';
import { ReorderAnalysisService } from '../services/ReorderAnalysisService';

const prisma = new PrismaClient();
const reorderService = new ReorderAnalysisService(prisma);

export function setupReorderHandlers() {
  // Get all reorder alerts
  ipcMain.handle('reorder:getAlerts', async () => {
    try {
      const analysis = await reorderService.analyzeReorderNeeds();
      return { success: true, data: analysis };
    } catch (error) {
      console.error('Error getting reorder alerts:', error);
      return { success: false, error: error.message };
    }
  });

  // Get reorder alerts for specific product
  ipcMain.handle('reorder:getProductAlerts', async (_, productId: string) => {
    try {
      const alerts = await reorderService.getProductReorderAlerts(productId);
      return { success: true, data: alerts };
    } catch (error) {
      console.error('Error getting product reorder alerts:', error);
      return { success: false, error: error.message };
    }
  });

  // Get alerts by priority
  ipcMain.handle('reorder:getAlertsByPriority', async (_, priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') => {
    try {
      const alerts = await reorderService.getAlertsByPriority(priority);
      return { success: true, data: alerts };
    } catch (error) {
      console.error('Error getting alerts by priority:', error);
      return { success: false, error: error.message };
    }
  });

  // Get urgent alerts (critical and high priority)
  ipcMain.handle('reorder:getUrgentAlerts', async () => {
    try {
      const alerts = await reorderService.getUrgentAlerts();
      return { success: true, data: alerts };
    } catch (error) {
      console.error('Error getting urgent alerts:', error);
      return { success: false, error: error.message };
    }
  });

  // Get reorder analysis summary
  ipcMain.handle('reorder:getSummary', async () => {
    try {
      const analysis = await reorderService.analyzeReorderNeeds();
      return { success: true, data: analysis.summary };
    } catch (error) {
      console.error('Error getting reorder summary:', error);
      return { success: false, error: error.message };
    }
  });
}
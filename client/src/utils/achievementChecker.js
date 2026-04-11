import { achievementsApi } from '../api/achievements'
import { pointsApi } from '../api/points'

export async function checkAndUnlockAchievements(context = {}) {
  const {
    isFirstReview = false,
    isPerfectQuiz = false,
  } = context

  // 主动拉取真实数据，不依赖调用方传入
  let totalPoints = context.totalPoints || 0
  let masteredWords = context.masteredWords || 0
  let purchaseCount = context.purchaseCount || 0
  let dolphinSkins = context.dolphinSkins || 0
  let streakDays = context.streakDays || 0
  let perfectStreak = context.perfectStreak || 0

  try {
    // 拉取积分数据
    const pointsRes = await pointsApi.getPoints()
    if (pointsRes?.data?.totalPoints) {
      totalPoints = Math.max(totalPoints, pointsRes.data.totalPoints)
    }

    // 拉取成就进度数据
    const achRes = await achievementsApi.getAchievements()
    if (achRes?.data?.progress) {
      const p = achRes.data.progress
      streakDays = Math.max(streakDays, p.streakDays || 0)
      perfectStreak = Math.max(perfectStreak, p.perfectStreak || 0)
      masteredWords = Math.max(masteredWords, p.masteredWords || 0)
      purchaseCount = Math.max(purchaseCount, p.totalPurchases || 0)
      dolphinSkins = Math.max(dolphinSkins, p.dolphinSkins || 0)
    }
  } catch (e) {
    console.warn('拉取成就数据失败，使用传入值:', e)
  }

  const toCheck = []

  // 入门系列
  if (isFirstReview) toCheck.push('first_review')
  if (isPerfectQuiz) toCheck.push('first_perfect', 'perfect_once')
  if (masteredWords >= 1) toCheck.push('first_mastery')

  // 坚持系列
  if (streakDays >= 3) toCheck.push('streak_3')
  if (streakDays >= 7) toCheck.push('streak_7')
  if (streakDays >= 30) toCheck.push('streak_30')

  // 数量系列
  if (masteredWords >= 10) toCheck.push('words_10')
  if (masteredWords >= 50) toCheck.push('words_50')
  if (masteredWords >= 100) toCheck.push('words_100')
  if (masteredWords >= 200) toCheck.push('words_200')

  // 完美系列
  if (perfectStreak >= 5) toCheck.push('perfect_5')

  // 积分系列
  if (totalPoints >= 100) toCheck.push('points_100')
  if (totalPoints >= 1000) toCheck.push('points_1000')
  if (totalPoints >= 5000) toCheck.push('points_5000')

  // 收藏系列
  if (purchaseCount >= 1) toCheck.push('first_purchase')
  if (dolphinSkins >= 3) toCheck.push('skins_3')

  // Batch unlock all at once instead of N+1 individual calls
  if (toCheck.length === 0) return []
  
  try {
    const result = await achievementsApi.unlockBatch(toCheck)
    return result.unlocked || []
  } catch (e) {
    console.warn('批量解锁成就失败:', e)
    return []
  }
}

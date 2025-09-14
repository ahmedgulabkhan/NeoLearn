import jwt from 'jsonwebtoken'
import { supabase } from './supabase'

export interface User {
  id: string
  email: string
  name?: string
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  // Check if user exists
  if (!data.user) {
    throw new Error('User not found')
  }

  const token = jwt.sign(
    { userId: data.user.id, email: data.user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )

  return { user: data.user, token }
}

export const signUp = async (email: string, password: string, name?: string) => {
  // Try regular signup first
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || '',
      },
    },
  })

  if (error) {
    if (error.message.includes('User already registered') || error.message.includes('already been registered')) {
      throw new Error('An account with this email already exists. Please sign in instead.')
    }
    throw error
  }

  if (!data.user) {
    throw new Error('Failed to create user account')
  }

  // Try to sign in immediately after signup
  // This will work if email confirmation is disabled in Supabase settings
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      // If sign in fails, it might be due to email confirmation requirement
      console.warn('Sign in failed after signup:', signInError.message)
      
      // Return the user anyway - they can try to sign in later after confirming email
      const token = jwt.sign(
        { userId: data.user.id, email: data.user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      )
      return { user: data.user, token }
    }

    if (signInData.user) {
      // Sign in successful - return the confirmed user
      const token = jwt.sign(
        { userId: signInData.user.id, email: signInData.user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      )
      return { user: signInData.user, token }
    }
  } catch (signInError) {
    console.warn('Sign in attempt failed:', signInError)
  }

  // Fallback: return the user even if they need email confirmation
  const token = jwt.sign(
    { userId: data.user.id, email: data.user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )

  return { user: data.user, token }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string }
  } catch {
    return null
  }
}

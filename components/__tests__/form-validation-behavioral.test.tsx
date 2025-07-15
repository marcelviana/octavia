import React, { useState } from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { testFormValidation, testUserInteraction, testErrorHandling } from '@/lib/__tests__/behavioral-test-helpers'

/**
 * Behavioral Form Validation Tests
 * 
 * These tests demonstrate how to test forms behaviorally rather than just checking
 * for field presence. They focus on user workflows and real-world scenarios.
 */

// Mock form component for demonstration
  interface ContactFormProps {
    onSubmit: (data: any) => Promise<any>
    initialValues?: any
  }

  const ContactForm = ({ onSubmit, initialValues = {} }: ContactFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    ...initialValues
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors }
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Name is required'
        } else if (value.length < 2) {
          newErrors.name = 'Name must be at least 2 characters'
        } else {
          delete newErrors.name
        }
        break
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Please enter a valid email'
        } else {
          delete newErrors.email
        }
        break
      case 'message':
        if (!value.trim()) {
          newErrors.message = 'Message is required'
        } else if (value.length < 10) {
          newErrors.message = 'Message must be at least 10 characters'
        } else {
          delete newErrors.message
        }
        break
      default:
        break
    }
    
    setErrors(newErrors)
    return !newErrors[name]
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
         setFormData((prev: any) => ({ ...prev, [name]: value }))
    
    // Real-time validation
    if (hasSubmitted) {
      validateField(name, value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent multiple submissions
    if (isSubmitting) {
      return
    }
    
    setHasSubmitted(true)
    
    // Validate all fields at once
    const newErrors: Record<string, string> = {}
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    // Validate message
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }
    
    setErrors(newErrors)
    
    // Check if form is valid
    const isValid = Object.keys(newErrors).length === 0
    
    if (!isValid) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit(e as any)
    }
  }

  return (
    <form role="form" aria-labelledby="contact-form-title" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
      <h2 id="contact-form-title">Contact Us</h2>
      
      <div>
        <label htmlFor="name" aria-label="Name">Name *</label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          aria-label="Name"
        />
        {errors.name && (
          <div id="name-error" role="alert" aria-live="polite">
            {errors.name}
          </div>
        )}
      </div>
      
      <div>
        <label htmlFor="email" aria-label="Email">Email *</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          aria-label="Email"
        />
        {errors.email && (
          <div id="email-error" role="alert" aria-live="polite">
            {errors.email}
          </div>
        )}
      </div>
      
      <div>
        <label htmlFor="phone" aria-label="Phone Number">Phone (Optional)</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? 'phone-error' : undefined}
          aria-label="Phone"
        />
        {errors.phone && (
          <div id="phone-error" role="alert" aria-live="polite">
            {errors.phone}
          </div>
        )}
      </div>
      
      <div>
        <label htmlFor="message" aria-label="Message">Message *</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
          aria-label="Message"
        />
        {errors.message && (
          <div id="message-error" role="alert" aria-live="polite">
            {errors.message}
          </div>
        )}
      </div>
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}

describe('Form Validation - Behavioral Testing', () => {
  describe('Complete Form Workflow', () => {
    it('guides user through complete form submission process', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockResolvedValue(true)
      const mockOnError = vi.fn()

      render(<ContactForm onSubmit={mockOnSubmit} />)

      // User sees accessible form
      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()
      expect(screen.getByText('Contact Us')).toBeInTheDocument()

      // User attempts to submit empty form
      const submitButton = screen.getByRole('button', { name: /send message/i })
      await act(async () => {
        await user.click(submitButton)
      })

      // System shows validation errors for required fields
      expect(screen.getByText('Name is required')).toBeInTheDocument()
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Message is required')).toBeInTheDocument()

      // User fills in name
      const nameField = document.getElementById('name')
      await act(async () => {
        if (nameField) await user.type(nameField, 'John Doe')
      })

      // User enters invalid email
      const emailField = document.getElementById('email')
      await act(async () => {
        if (emailField) await user.type(emailField, 'invalid-email')
        await user.click(submitButton)
      })

      // System shows email format validation
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()

      // User enters valid email but short message
      await act(async () => {
        if (emailField) {
          await user.clear(emailField)
          await user.type(emailField, 'john@example.com')
        }
        const messageField = document.getElementById('message')
        if (messageField) await user.type(messageField, 'Hi')
        await user.click(submitButton)
      })

      // System shows message length validation
      expect(screen.getByText('Message must be at least 10 characters')).toBeInTheDocument()

      // User enters valid message
      await act(async () => {
        const messageField = document.getElementById('message')
        if (messageField) {
          await user.clear(messageField)
          await user.type(messageField, 'This is a longer message that meets the requirements')
        }
        await user.click(submitButton)
      })

      // System processes valid form
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a longer message that meets the requirements',
        phone: ''
      })

      // Wait for submission to complete
      await act(async () => {
        await mockOnSubmit.mock.calls[0][0] // Wait for the promise to resolve
      })

      // System processes valid form
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a longer message that meets the requirements',
        phone: ''
      })
    })

    it('handles optional fields correctly', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockResolvedValue(true)

      render(<ContactForm onSubmit={mockOnSubmit} />)

      // User fills required fields and optional phone field
      await act(async () => {
        const nameField = document.getElementById('name')
        const emailField = document.getElementById('email')
        const messageField = document.getElementById('message')
        const phoneField = document.getElementById('phone')
        
        if (nameField) await user.type(nameField, 'Jane Doe')
        if (emailField) await user.type(emailField, 'jane@example.com')
        if (messageField) await user.type(messageField, 'This is a valid message')
        if (phoneField) await user.type(phoneField, '+1 (555) 123-4567')
        
        await user.click(screen.getByRole('button', { name: /send message/i }))
      })

      // System accepts form with valid optional field
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'This is a valid message',
        phone: '+1 (555) 123-4567'
      })
    })

    it('handles form submission errors gracefully', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockRejectedValue(new Error('Network error'))

      render(<ContactForm onSubmit={mockOnSubmit} />)

      // User fills out valid form
      await act(async () => {
        const nameField = document.getElementById('name')
        const emailField = document.getElementById('email')
        const messageField = document.getElementById('message')
        
        if (nameField) await user.type(nameField, 'John Doe')
        if (emailField) await user.type(emailField, 'john@example.com')
        if (messageField) await user.type(messageField, 'This is a valid message')
        
        await user.click(screen.getByRole('button', { name: /send message/i }))
      })

      // Form returns to normal state
      expect(screen.getByText('Send Message')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send message/i })).not.toBeDisabled()
    })
  })

  describe('Accessibility and Keyboard Navigation', () => {
    it('supports complete keyboard navigation workflow', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockResolvedValue(true)

      render(<ContactForm onSubmit={mockOnSubmit} />)

      // User navigates form using keyboard
      await act(async () => {
        await user.tab() // Focus on name field
      })

      const nameField = document.getElementById('name')
      expect(nameField).toHaveFocus()

      // User fills form using keyboard
      await act(async () => {
        const emailField = document.getElementById('email')
        const phoneField = document.getElementById('phone')
        
        if (nameField) await user.type(nameField, 'Keyboard User')
        await user.tab() // Move to email
        if (emailField) await user.type(emailField, 'keyboard@example.com')
        await user.tab() // Move to phone
        await user.tab() // Skip phone, move to message
        const messageField = document.getElementById('message')
        if (messageField) await user.type(messageField, 'Navigated using keyboard only')
        await user.tab() // Move to submit button
      })

      expect(screen.getByRole('button', { name: /send message/i })).toHaveFocus()

      // User submits using keyboard
      await act(async () => {
        await user.keyboard('{Enter}')
      })

      // System processes keyboard submission
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Keyboard User',
        email: 'keyboard@example.com',
        message: 'Navigated using keyboard only',
        phone: ''
      })
    })

    it('provides proper ARIA labels and error announcements', async () => {
      const user = userEvent.setup()
             render(<ContactForm onSubmit={vi.fn()} />)

      // Check form accessibility
      const form = screen.getByRole('form')
      expect(form).toHaveAttribute('aria-labelledby', 'contact-form-title')

      // Check field accessibility
      const nameField = document.getElementById('name')
      expect(nameField).toHaveAttribute('aria-label', 'Name')

      // Trigger validation error
      await act(async () => {
        await user.click(screen.getByRole('button', { name: /send message/i }))
      })

      // Check error accessibility
      expect(nameField).toHaveAttribute('aria-invalid', 'true')
      expect(nameField).toHaveAttribute('aria-describedby', 'name-error')
      
      const errorMessage = screen.getByText('Name is required')
      expect(errorMessage).toHaveAttribute('role', 'alert')
      expect(errorMessage).toHaveAttribute('id', 'name-error')
    })
  })

  describe('Real-World Scenarios', () => {
    it('handles rapid user interactions without breaking', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockResolvedValue(true)

      render(<ContactForm onSubmit={mockOnSubmit} />)

      // User rapidly types and submits
      await act(async () => {
        const nameField = document.getElementById('name')
        const emailField = document.getElementById('email')
        const messageField = document.getElementById('message')
        
        if (nameField) await user.type(nameField, 'Speed Typer')
        if (emailField) await user.type(emailField, 'speed@example.com')
        if (messageField) await user.type(messageField, 'Fast message')
        
        await user.click(screen.getByRole('button', { name: /send message/i }))
      })

      // Wait for submission to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      // System handles submission
      expect(mockOnSubmit).toHaveBeenCalledTimes(1)
    })

    it('maintains form state during validation cycles', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = vi.fn().mockResolvedValue(true)
      render(<ContactForm onSubmit={mockOnSubmit} />)

      // User partially fills form
      await act(async () => {
        await user.type(screen.getByRole('textbox', { name: /name/i }), 'Partial User')
        await user.type(screen.getByRole('textbox', { name: /email/i }), 'partial@example.com')
        await user.click(screen.getByRole('button', { name: /send message/i }))
      })

      // User sees validation error for missing message
      await waitFor(() => {
        expect(screen.getByText('Message is required')).toBeInTheDocument()
      })

      // User adds message and submits successfully
      await act(async () => {
        await user.type(screen.getByRole('textbox', { name: /message/i }), 'Now adding the message')
        await user.click(screen.getByRole('button', { name: /send message/i }))
      })

      // System processes complete form
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Partial User',
        email: 'partial@example.com',
        message: 'Now adding the message'
      }))
    })
  })
}) 
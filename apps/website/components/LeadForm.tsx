// Lead Capture Form Component
// Used on website to collect leads for CRM

import React, { useState } from 'react';
import { Button } from '../../../design-system/components/Button';
import { designTokens } from '../../../design-system/tokens';

interface LeadFormData {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  serviceInterest?: string;
}

interface LeadFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  initialValues?: Partial<LeadFormData>;
}

interface FormErrors {
  [key: string]: string;
}

export const LeadForm: React.FC<LeadFormProps> = ({
  onSuccess,
  onError,
  initialValues,
}) => {
  const [formData, setFormData] = useState<LeadFormData>({
    name: initialValues?.name || '',
    email: initialValues?.email || '',
    phone: initialValues?.phone || '',
    message: initialValues?.message || '',
    serviceInterest: initialValues?.serviceInterest || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = 'Name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }

    if (formData.phone && formData.phone.trim().length > 0) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
        newErrors.phone = 'Invalid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          message: formData.message || undefined,
          serviceInterest: formData.serviceInterest || undefined,
          source: 'website',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit form');
      }

      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        serviceInterest: '',
      });

      onSuccess?.();

      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyles = {
    width: '100%',
    padding: `${designTokens.spacing.md} ${designTokens.spacing.sm}`,
    fontSize: designTokens.typography.body1.fontSize,
    fontFamily: designTokens.typography.fontFamilies.sans,
    border: `1px solid ${designTokens.colors.neutral[200]}`,
    borderRadius: designTokens.spacing.borderRadius.md,
    boxSizing: 'border-box' as const,
  };

  const labelStyles = {
    display: 'block',
    marginBottom: designTokens.spacing.xs,
    fontSize: designTokens.typography.label.fontSize,
    fontWeight: designTokens.typography.label.fontWeight,
    color: designTokens.colors.neutral[800],
  };

  const fieldStyles = {
    marginBottom: designTokens.spacing.lg,
  };

  const errorStyles = {
    color: designTokens.colors.semantic.error,
    fontSize: designTokens.typography.small.fontSize,
    marginTop: designTokens.spacing.xs,
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
      {submitSuccess && (
        <div
          style={{
            padding: designTokens.spacing.md,
            backgroundColor: designTokens.colors.semantic.success,
            color: 'white',
            borderRadius: designTokens.spacing.borderRadius.md,
            marginBottom: designTokens.spacing.lg,
            fontSize: designTokens.typography.body2.fontSize,
          }}
        >
          Thank you for your submission! We'll be in touch soon.
        </div>
      )}

      <div style={fieldStyles}>
        <label htmlFor="name" style={labelStyles}>
          Name *
        </label>
        <input
          id="name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Your full name"
          style={inputStyles}
          required
        />
        {errors.name && <div style={errorStyles}>{errors.name}</div>}
      </div>

      <div style={fieldStyles}>
        <label htmlFor="email" style={labelStyles}>
          Email *
        </label>
        <input
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your@email.com"
          style={inputStyles}
          required
        />
        {errors.email && <div style={errorStyles}>{errors.email}</div>}
      </div>

      <div style={fieldStyles}>
        <label htmlFor="phone" style={labelStyles}>
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+20 1XX XXX XXXX"
          style={inputStyles}
        />
        {errors.phone && <div style={errorStyles}>{errors.phone}</div>}
      </div>

      <div style={fieldStyles}>
        <label htmlFor="serviceInterest" style={labelStyles}>
          Service Interest
        </label>
        <select
          id="serviceInterest"
          name="serviceInterest"
          value={formData.serviceInterest}
          onChange={handleChange}
          style={inputStyles}
        >
          <option value="">-- Select a service --</option>
          <option value="web_design">Web Design</option>
          <option value="mobile_app">Mobile App</option>
          <option value="branding">Branding</option>
          <option value="digital_marketing">Digital Marketing</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div style={fieldStyles}>
        <label htmlFor="message" style={labelStyles}>
          Message
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Tell us about your project..."
          style={{
            ...inputStyles,
            minHeight: '120px',
            fontFamily: designTokens.typography.fontFamilies.sans,
            resize: 'vertical',
          }}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        isLoading={isLoading}
        isDisabled={isLoading}
      >
        {isLoading ? 'Submitting...' : 'Get in Touch'}
      </Button>
    </form>
  );
};

export default LeadForm;

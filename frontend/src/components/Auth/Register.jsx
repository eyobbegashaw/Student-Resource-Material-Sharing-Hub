import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { resourcesAPI } from '../../services/api';
import { triggerGoogleAuth } from '../../services/googleAuth';
import toast from 'react-hot-toast';
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  BuildingLibraryIcon,
  AcademicCapIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const GoogleIcon = () => (
  <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const Register = () => {
  const { register: registerUser, verifyOTP, resendOTP, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 2-step verification states
  const [step, setStep] = useState(() => sessionStorage.getItem('pending_reg_email') ? 'otp' : 'register');
  const [pendingEmail, setPendingEmail] = useState(() => sessionStorage.getItem('pending_reg_email') || '');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const digitInputsRef = useRef([]);

  const [universities, setUniversities] = useState([]);
  const [departments, setDepartments] = useState([]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password', '');

  // Resend countdown timer
  useEffect(() => {
    let interval = null;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setErrorMessage('');
    triggerGoogleAuth({
      onSuccess: async (googleData) => {
        try {
          await loginWithGoogle(googleData);
          toast.success(`Welcome, ${googleData.first_name || 'Student'}!`);
          navigate('/dashboard');
        } catch (err) {
          const msg = err.response?.data?.message || 'Google registration failed';
          setErrorMessage(msg);
          toast.error(msg);
        } finally {
          setIsLoading(false);
        }
      },
      onError: (err) => {
        setIsLoading(false);
        if (err?.type === 'popup_closed') {
          toast('Google sign-in window was closed', { icon: 'ℹ️' });
          return;
        }
        const msg = err?.message || 'Google sign-in was cancelled or failed';
        setErrorMessage(msg);
        toast.error(msg);
      },
    });
  };

  // Load registered universities & departments for datalists
  useEffect(() => {
    resourcesAPI.getFilterOptions()
      .then((res) => {
        setUniversities(res.data?.universities || []);
        setDepartments(res.data?.departments || []);
      })
      .catch((err) => {
        console.error(err);
        setUniversities([]);
        setDepartments([]);
      });
  }, []);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMessage('');
    const emailToRegister = data.email.trim().toLowerCase();
    try {
      const res = await registerUser({
        username: emailToRegister.split('@')[0],
        email: emailToRegister,
        password: data.password,
        password2: data.confirmPassword,
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        university_name: data.university_name?.trim() || '',
        department_name: data.department_name?.trim() || '',
        year_of_study: data.yearOfStudy ? parseInt(data.yearOfStudy, 10) : null,
      });

      if (res?.require_otp) {
        setPendingEmail(emailToRegister);
        sessionStorage.setItem('pending_reg_email', emailToRegister);
        setStep('otp');
        setResendTimer(60);
        setOtpDigits(['', '', '', '', '', '']);
        toast.success(res.message || 'A 6-digit verification code has been sent to your email!');
        setTimeout(() => {
          digitInputsRef.current[0]?.focus();
        }, 150);
      } else {
        toast.success('Account created successfully! Welcome to Student Hub.');
        navigate('/dashboard');
      }
    } catch (error) {
      const errData = error.response?.data;
      let msg = 'Registration failed. Please check your information.';
      if (typeof errData === 'object' && errData !== null) {
        const firstKey = Object.keys(errData)[0];
        msg = `${firstKey}: ${Array.isArray(errData[firstKey]) ? errData[firstKey][0] : errData[firstKey]}`;
      }
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (cleaned.length > 1) {
      // Pasted full code or multi-digit
      const pasted = cleaned.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      digitInputsRef.current[nextIdx]?.focus();

      if (pasted.length === 6) {
        handleVerifyOtp(newDigits.join(''));
      }
      return;
    }

    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    if (cleaned && index < 5) {
      digitInputsRef.current[index + 1]?.focus();
    }

    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      handleVerifyOtp(fullCode);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      digitInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      digitInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);
    const nextIdx = Math.min(pasted.length, 5);
    digitInputsRef.current[nextIdx]?.focus();
    if (pasted.length === 6) {
      handleVerifyOtp(pasted);
    }
  };

  const handleVerifyOtp = async (codeToVerify) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    try {
      const res = await verifyOTP({
        email: pendingEmail,
        otp: code,
      });
      sessionStorage.removeItem('pending_reg_email');
      toast.success(res.message || 'Email verified successfully! Welcome to your dashboard.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid verification code';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage('');
    try {
      const res = await resendOTP(pendingEmail);
      setResendTimer(60);
      setOtpDigits(['', '', '', '', '', '']);
      digitInputsRef.current[0]?.focus();
      toast.success(res.message || 'A new 6-digit verification code has been sent to your email.');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to resend code';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200/80 dark:border-gray-800 p-8 sm:p-10 transition-colors">
        
        {step === 'otp' ? (
          /* ========================================================================= */
          /* STEP 2: 6-DIGIT EMAIL OTP VERIFICATION */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4">
                <EnvelopeIcon className="h-7 w-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {t('auth_otp_title')}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
                {t('auth_otp_subtitle')}{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400 block sm:inline mt-1 sm:mt-0">
                  {pendingEmail}
                </span>
              </p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-600 dark:text-red-400 text-center">
                {errorMessage}
              </div>
            )}

            {/* 6 Digit Inputs */}
            <div>
              <label className="block text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                {t('auth_otp_input_label')}
              </label>
              <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (digitInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-black font-mono rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-600 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            {/* Submit Verify Button */}
            <button
              type="button"
              onClick={() => handleVerifyOtp()}
              disabled={isVerifying || otpDigits.join('').length !== 6}
              className="w-full btn-primary py-3 text-sm font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              <span>{isVerifying ? t('auth_otp_verifying') : t('auth_otp_btn')}</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>

            {/* Resend and Back Navigation */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || isResending}
                className={`font-semibold transition-colors ${
                  resendTimer > 0
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
                }`}
              >
                {isResending
                  ? t('auth_otp_resending')
                  : resendTimer > 0
                  ? `${t('auth_otp_resend_wait')} ${resendTimer}s`
                  : t('auth_otp_resend')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('register');
                  sessionStorage.removeItem('pending_reg_email');
                  setErrorMessage('');
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline font-medium"
              >
                {t('auth_otp_back')}
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* STEP 1: REGISTRATION FORM */
          /* ========================================================================= */
          <>
            {/* Brand Header */}
            <div className="text-center mb-8">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4">
                <AcademicCapIcon className="h-7 w-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {t('auth_register_title')}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                {t('auth_register_subtitle')}
              </p>
            </div>

            {/* Error notification banner */}
            {errorMessage && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-semibold text-red-600 dark:text-red-400">
                {errorMessage}
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-200 text-sm font-semibold shadow-sm transition-all active:scale-[0.99] mb-6"
            >
              <GoogleIcon />
              <span>{isLoading ? t('auth_google_connecting') : t('auth_google_btn')}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-gray-200 dark:border-gray-800 w-full" />
              <span className="bg-white dark:bg-gray-900 px-3 text-xs uppercase tracking-wider text-gray-400 font-medium">
                {t('auth_or')}
              </span>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    {t('auth_first_name')} *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register('firstName', { required: 'First name is required' })}
                      placeholder="e.g. Eyob"
                      className="input-field text-sm pl-9"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    {t('auth_last_name')} *
                  </label>
                  <input
                    type="text"
                    {...register('lastName', { required: 'Last name is required' })}
                    placeholder="e.g. Begashaw"
                    className="input-field text-sm"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth_email_label') || 'Email'} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Please enter a valid email address',
                      },
                    })}
                    placeholder="student@gmail.com or name@university.edu.et"
                    className="input-field text-sm pl-9"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* University & Department row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    {t('upload_field_uni')}
                  </label>
                  <input
                    type="text"
                    list="reg-universities"
                    {...register('university_name')}
                    placeholder="e.g. Addis Ababa University"
                    className="input-field text-sm"
                  />
                  <datalist id="reg-universities">
                    {universities.map((uni, idx) => (
                      <option key={uni.id || uni.value || uni.name || idx} value={uni.name || uni.value} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    {t('upload_field_dept')}
                  </label>
                  <input
                    type="text"
                    list="reg-departments"
                    {...register('department_name')}
                    placeholder="e.g. Computer Science"
                    className="input-field text-sm"
                  />
                  <datalist id="reg-departments">
                    {departments.map((dept, idx) => (
                      <option key={dept.id || dept.value || dept.name || idx} value={dept.name || dept.value} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Year of study */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth_year_label')} (Number)
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  {...register('yearOfStudy')}
                  placeholder="e.g. 1, 2, 3, 4"
                  className="input-field text-sm"
                />
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    {t('auth_password_label')} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      className="input-field text-sm pr-9"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    {t('auth_confirm_password')} *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('confirmPassword', {
                      required: 'Please confirm password',
                      validate: (val) => val === password || "Passwords don't match",
                    })}
                    className="input-field text-sm"
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-2.5 text-sm font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 active:scale-[0.99] mt-3"
              >
                <span>{isLoading ? 'Sending Verification Code...' : t('nav_register')}</span>
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </form>

            {/* Link to Login */}
            <div className="text-center mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
              {t('auth_have_account')}{' '}
              <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                {t('nav_login')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;

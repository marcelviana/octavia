"use client";

import React, { Component, ReactNode } from 'react';
import { LinhaDeAviso } from "@/components/identidade/linha-de-aviso";
import { FRASES_LISTA, comDado } from "@/components/library/frases-lista";
import { LibraryError } from '@/types/library';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class LibraryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Library Error Boundary caught an error:', error, errorInfo);
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // I1-PR-9 (nota de `LIB-erro`): o erro de render usa a mesma linha, com "algo deu errado"
      return (
        <LinhaDeAviso
          motivo={comDado("lib.erro", { motivo: FRASES_LISTA["motivo.generico"] })}
          acao={{ rotulo: FRASES_LISTA["acao.tentar"], onPress: this.handleRetry }}
        />
      );
    }

    return this.props.children;
  }
}

export default LibraryErrorBoundary;

// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * ErrorBoundary pour capturer les crash React et éviter l'écran blanc.
 * Affiche un message d'erreur récupérable au lieu de crasher toute l'app.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || "Erreur inconnue" };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🔴 ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>
            {this.props.fallbackMessage || "Oups, une erreur est survenue"}
          </Text>
          <Text style={styles.detail}>{this.state.errorMessage}</Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#fff",
    borderRadius: 20,
  },
  icon: { fontSize: 48, marginBottom: 15 },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  detail: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#E31C25",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default ErrorBoundary;

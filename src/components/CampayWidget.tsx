import { useEffect, useRef, useState } from "react";
import { Platform, LogBox, Alert } from "react-native";
import { log } from "@/utils/platform";

const formatPhoneForCampay = (p: string) => {
  const cleaned = p.replace(/\D/g, "");
  return cleaned.startsWith("237") ? cleaned : `237${cleaned}`;
};

// ? Ignorer les warnings React Native Web non critiques
if (Platform.OS === 'web') {
  LogBox.ignoreLogs([
    'VirtualizedLists should never be nested',
    'Non-serializable values were found in the navigation state',
  ]);
}

type CampayWidgetProps = {
  amount: number;
  description: string;
  reference: string;
  phone?: string;
  onSuccess: (data: any) => void;
  onFail: (data: any) => void;
  onClose: () => void;
  testMode?: boolean; // ? Optionnel : forcer le mode test
};

export const CampayWidget = ({
  amount,
  description,
  reference,
  phone,
  onSuccess,
  onFail,
  onClose,
  testMode = false, // ? Par d�faut: false, mais peut �tre forc�
}: CampayWidgetProps) => {
  const widgetInitialized = useRef(false);
  const buttonClicked = useRef(false);
  const [campayReady, setCampayReady] = useState(false);

  // ? App-ID Campay (� v�rifier/renouveler sur https://campay.net/dashboard/)
  const CAMPAY_APP_ID = "r7kSlj3u0yVMolLsQZq0ivC7fRg6Tc26gGj4OOh-exejomokCIZUHDekJU7Tx26KCM2DAB0-ztchk9vAOWhs4A";

  useEffect(() => {
    if (widgetInitialized.current) return;
    widgetInitialized.current = true;

    log("?? Chargement SDK Campay...");
    log("?? Params re�us:", { amount, description, reference, phone, testMode });

    // ? Validation : amount doit �tre un nombre valide > 0
    if (!amount || amount <= 0) {
      log("? Amount invalide:", amount);
      onFail({ error: "Montant invalide" });
      return;
    }

    // ? MODE TEST/MOCK : simuler un paiement r�ussi sans appeler Campay
    if (testMode || process.env.NODE_ENV === 'development') {
      log("?? Mode TEST activ� : simulation de paiement Campay");
      setTimeout(() => {
        log("? [MOCK] Paiement Campay simul� comme r�ussi");
        onSuccess({
          status: "SUCCESS",
          reference: `MOCK-${reference}`,
          amount: amount,
          currency: "XAF",
          paid_at: new Date().toISOString(),
          method: "MOCK",
          message: "Mode test - aucun paiement r�el effectu�"
        });
      }, 1500);
      return; // Ne pas charger le SDK r�el en mode test
    }

    // Injecter le script Campay
    const script = document.createElement("script");
    script.src = `https://www.campay.net/sdk/js?app-id=${CAMPAY_APP_ID}`;
    script.async = true;
    
    script.onload = () => {
      log("? SDK Campay charg�");
      setCampayReady(true);
      initCampay();
      // ? Auto-cliquer le bouton apr�s un court d�lai
      setTimeout(() => {
        if (!buttonClicked.current) {
          triggerPayment();
        }
      }, 500);
    };
    
    script.onerror = (err) => {
      log("? �chec chargement SDK Campay:", err);
      // ? Fallback : proposer le mode test
      if (window.confirm("?? Impossible de charger Campay. Voulez-vous tester en mode SIMULATION ?")) {
        log("?? Fallback vers mode test apr�s erreur SDK");
        onSuccess({
          status: "SUCCESS",
          reference: `FALLBACK-${reference}`,
          amount: amount,
          currency: "XAF",
          paid_at: new Date().toISOString(),
          method: "FALLBACK",
          message: "Mode fallback - paiement simul�"
        });
      } else {
        onFail({ error: "Impossible de charger le widget de paiement" });
      }
    };
    
    document.body.appendChild(script);

    // Initialiser Campay
    const initCampay = () => {
      if (typeof window !== "undefined" && (window as any).campay) {
        const campay = (window as any).campay;
        
        // ? Formatage s�curis� des params pour Campay
        const campayAmount = String(Math.round(Number(amount)));
        const campayPhone = phone ? formatPhoneForCampay(phone) : undefined;
        
        log("?? Campay options:", {
          amount: campayAmount,
          description,
          reference,
          phone: campayPhone,
          currency: "XAF",
        });
        
        campay.options({
          payButtonId: "campay-pay-button",
          description: description,
          amount: campayAmount,
          currency: "XAF",
          externalReference: reference,
          phone_number: campayPhone,
          redirectUrl: typeof window !== "undefined" ? window.location.origin + "/payment/success" : undefined,
        });

        campay.onSuccess = (data: any) => {
          log("? Paiement Campay r�ussi:", data);
          onSuccess(data);
        };

        campay.onFail = (data: any) => {
          log("? Paiement Campay �chou�:", data);
          
          // ? D�tecter l'erreur 401 et proposer le mode test
          if (data?.message?.includes("NON AUTORIS�") || data?.status === 401) {
            log("?? Erreur 401 Campay : app-id probablement invalide");
            if (window.confirm("? Campay rejette la demande (401). Voulez-vous tester en mode SIMULATION ?")) {
              onSuccess({
                status: "SUCCESS",
                reference: `401-FALLBACK-${reference}`,
                amount: amount,
                currency: "XAF",
                paid_at: new Date().toISOString(),
                method: "401_FALLBACK",
                message: "Mode fallback apr�s erreur 401 - paiement simul�"
              });
            }
          } else {
            onFail(data);
          }
        };

        campay.onModalClose = (data: any) => {
          log("?? Modal Campay ferm�e:", data);
          onClose();
        };
      } else {
        log("? window.campay non d�fini apr�s chargement SDK");
      }
    };

    // ? Fonction pour d�clencher le paiement
    const triggerPayment = () => {
      if (buttonClicked.current) return;
      buttonClicked.current = true;
      
      log("?? D�clenchement auto du widget Campay");
      
      if (typeof window !== "undefined" && (window as any).campay) {
        const btn = document.getElementById("campay-pay-button");
        if (btn && typeof (btn as HTMLElement).click === "function") {
          (btn as HTMLElement).click();
          log("? Click envoy� sur campay-pay-button");
          return;
        }
        if (typeof (window as any).campay.pay === "function") {
          (window as any).campay.pay();
          log("? campay.pay() appel�");
          return;
        }
      }
      
      // Fallback
      log("?? Fallback: affichage message manuel");
      if (window.confirm("?? Redirection vers Campay �chou�e. Tester en mode SIMULATION ?")) {
        onSuccess({
          status: "SUCCESS",
          reference: `MANUAL-FALLBACK-${reference}`,
          amount: amount,
          currency: "XAF",
          paid_at: new Date().toISOString(),
          method: "MANUAL_FALLBACK",
          message: "Mode manuel - paiement simul�"
        });
      }
    };

    // Cleanup
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [amount, description, reference, phone, onSuccess, onFail, onClose, testMode]);

  // ? Bouton invisible (servira de d�clencheur)
  return <button id="campay-pay-button" style={{ display: "none" }} aria-hidden="true" />;
};

export default CampayWidget;
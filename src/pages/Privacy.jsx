import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Settings.module.css'

export default function Privacy() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={styles.title}>Polityka prywatności</h1>
        <div style={{ width: 36 }} />
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>Ostatnia aktualizacja: Maj 2025</p>
        <div className={styles.group}>
          <div style={{ padding: '16px', lineHeight: 1.7, fontSize: 14, color: 'var(--text-secondary)' }}>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>1. Jakie dane zbieramy</p>
            <p style={{ marginBottom: 16 }}>
              Lucent zbiera wyłącznie dane, które sam wprowadzasz: wydatki, kategorie, cele oszczędnościowe,
              stałe płatności i ustawienia konta. Nie zbieramy danych o lokalizacji, kontaktach ani innych
              wrażliwych informacjach.
            </p>

            <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>2. Jak przechowujemy dane</p>
            <p style={{ marginBottom: 16 }}>
              Dane są przechowywane lokalnie na Twoim urządzeniu (localStorage). Jeśli zdecydujesz się
              zalogować, Twoje dane są synchronizowane z Firebase Firestore (Google) za pomocą
              szyfrowanego połączenia HTTPS. Każdy użytkownik ma dostęp tylko do swoich własnych danych —
              jest to zapewnione przez reguły bezpieczeństwa Firebase.
            </p>

            <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>3. Udostępnianie danych</p>
            <p style={{ marginBottom: 16 }}>
              Nie sprzedajemy, nie wynajmujemy ani nie udostępniamy Twoich danych osobowych żadnym
              podmiotom trzecim. Dane są używane wyłącznie do działania aplikacji.
            </p>

            <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>4. Uwierzytelnianie</p>
            <p style={{ marginBottom: 16 }}>
              Logowanie odbywa się przez Google lub email/hasło, obsługiwane przez Firebase Authentication
              (Google). Lucent nie przechowuje Twoich haseł.
            </p>

            <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>5. Usuwanie danych</p>
            <p style={{ marginBottom: 16 }}>
              Możesz usunąć wszystkie swoje dane w dowolnym momencie z poziomu ustawień aplikacji.
              Po usunięciu konta wszystkie dane zostają trwale usunięte z serwerów.
            </p>

            <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>6. Kontakt</p>
            <p>
              W razie pytań dotyczących prywatności skontaktuj się z nami przez stronę aplikacji.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

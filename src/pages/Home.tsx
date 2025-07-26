import React from "react";
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div>
      <h2>{t('welcome_home')}</h2>
      <p>{t('this_is_home_page')}</p>
    </div>
  );
}

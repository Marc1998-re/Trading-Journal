import React from 'react';

const SettingsSection = ({ title, description, children }) => {
  return (
    <section className="settings-section">
      <header><h2>{title}</h2>{description && <p>{description}</p>}</header>
      <div>{children}</div>
    </section>
  );
};

export default SettingsSection;

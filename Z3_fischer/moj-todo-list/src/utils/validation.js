export const TITLE_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH = 1000;

/**
 * Validates todo form inputs and returns validation status along with field-specific error messages.
 */
export function validateTodoForm(formValues) {
  const errors = {
    title: '',
    description: '',
    date_from: '',
    date_to: '',
  };

  const trimmedTitle = (formValues.title || '').trim();
  const description = formValues.description || '';

  if (!trimmedTitle) {
    errors.title = 'Názov úlohy je povinný.';
  } else if (trimmedTitle.length > TITLE_MAX_LENGTH) {
    errors.title = `Názov môže mať maximálne ${TITLE_MAX_LENGTH} znakov.`;
  }

  if (description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Popis môže mať maximálne ${DESCRIPTION_MAX_LENGTH} znakov.`;
  }

  if (!formValues.date_from) {
    errors.date_from = 'Dátum a čas začiatku sú povinné.';
  }

  if (!formValues.date_to) {
    errors.date_to = 'Dátum a čas ukončenia sú povinné.';
  }

  if (formValues.date_from && formValues.date_to) {
    const start = new Date(formValues.date_from);
    const end = new Date(formValues.date_to);

    if (Number.isNaN(start.getTime())) {
      errors.date_from = 'Neplatný formát dátumu začiatku.';
    }
    if (Number.isNaN(end.getTime())) {
      errors.date_to = 'Neplatný formát dátumu ukončenia.';
    }
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start > end) {
      errors.date_to = 'Koniec úlohy nesmie byť skôr ako jej začiatok.';
    }
  }

  const isValid = !errors.title && !errors.description && !errors.date_from && !errors.date_to;

  return {
    isValid,
    errors,
  };
}
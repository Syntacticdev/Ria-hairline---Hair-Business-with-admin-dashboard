export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const isMongoId = (id: string): boolean => /^[0-9a-fA-F]{24}$/.test(id);
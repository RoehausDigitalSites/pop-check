export type StatsSeries = {
  key: string;
  label: string;
};

export type StatsRow = {
  label: string;
  fullDate: string;
  [key: string]: string | number | null | undefined;
};

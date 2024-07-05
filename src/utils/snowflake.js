import SnowflakeId from 'snowflake-id';

const snowflake = new SnowflakeId();

export const generateSnowflakeId = () => {
    return Number(snowflake.generate());
};

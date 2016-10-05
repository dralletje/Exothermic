import tests from './_tests';
import exothermic from '../exothermic';

tests(data =>
  exothermic(data, {delay: -1})
)
